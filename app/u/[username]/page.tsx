import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import leaderboard from "@/generated/site-leaderboard.json";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { ProfileCard } from "./ProfileCard";
import { EditLinkIfOwner } from "./EditLinkIfOwner";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { FollowButton } from "./FollowButton";
import { GithubRepos } from "./GithubRepos";
import { getServerT } from "@/lib/i18n/server";

interface UserView {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email?: string | null;
  githubId?: number | null;
}

interface UserProjectItem {
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
}

interface UserPaperItem {
  /** Zotero group item key；有值时优先从后端 /api/user-center/zotero/items 拉元信息 */
  itemKey?: string;
  title?: string;
  authors?: string;
  year?: string | number;
  url?: string;
  abstract?: string;
}

interface ZoteroItemDto {
  itemKey: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  abstractNote: string;
  publicationTitle: string;
}

/**
 * 批量调后端 Zotero 代理，返回 itemKey → 元信息映射。
 * 任意失败或没 itemKey 时返回空 map，调用方走手填 fallback。
 */
async function fetchZoteroByKeys(
  keys: string[],
): Promise<Record<string, ZoteroItemDto>> {
  if (keys.length === 0) return {};
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return {};
  try {
    const res = await fetch(
      `${backendUrl}/api/user-center/zotero/items?keys=${encodeURIComponent(keys.join(","))}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return {};
    const json = (await res.json()) as {
      success: boolean;
      data?: ZoteroItemDto[];
    };
    if (!json.success || !Array.isArray(json.data)) return {};
    const map: Record<string, ZoteroItemDto> = {};
    for (const it of json.data) map[it.itemKey] = it;
    return map;
  } catch {
    return {};
  }
}

interface UserLinkItem {
  label: string;
  url: string;
}

interface Preferences {
  bio?: string;
  tagline?: string;
  links?: UserLinkItem[];
  projects?: UserProjectItem[];
  pinned_papers?: UserPaperItem[];
}

interface ProfileData {
  user: UserView;
  preferences: Preferences;
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  message?: string;
}

/**
 * SSR 获取用户主页基础信息（账户 + preferences）。
 * 服务端使用 BACKEND_URL 直连 Java 后端（不走 next.config.mjs rewrites，那是给浏览器用的）。
 * 贡献文档不走后端 DB，而是在组件里从 build-time 的 site-leaderboard.json 读取，
 * 目的：每次访问 /u/{x} 省一次 Neon 查询（免费额度有限）。docs 本来就是 git-based，
 * JSON 新鲜度和 DB 一致，都是 deploy 级。
 *
 * 错误策略：只有后端明确返回 404 或 success=false 才 return null（走 notFound()）。
 * 其他失败（500 / 网关异常 / JSON 解析错 / BACKEND_URL 缺失）一律抛错，
 * 让 Next error boundary 兜底，避免把"后端故障"伪装成"用户不存在"。
 */
function warnFetchProfile(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[fetchProfile] ${message}`, details ?? {});
  }
}

async function fetchProfile(identifier: string): Promise<ProfileData | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    // 关键配置缺失不能静默 notFound，给个可见错误
    throw new Error("BACKEND_URL is not configured");
  }
  const res = await fetch(
    `${backendUrl}/api/user-center/profile/${encodeURIComponent(identifier)}`,
    { next: { revalidate: 300 } },
  );
  // 404：用户确实不存在 → notFound
  if (res.status === 404) {
    warnFetchProfile("backend 404", { identifier });
    return null;
  }
  // 其他非 2xx 都抛，进 Next error boundary
  if (!res.ok) {
    throw new Error(
      `profile backend ${res.status} ${res.statusText} for ${identifier}`,
    );
  }
  const json = (await res.json()) as ProfileResponse;
  // 后端用 {success:false, message:"用户不存在"} 表示软 404
  if (!json.success || !json.data) {
    warnFetchProfile("backend success=false", {
      identifier,
      message: json.message,
    });
    return null;
  }
  return json.data;
}

/**
 * URL scheme 白名单：仅允许 http(s)/mailto，拦截 javascript: / data: 等向量。
 * 任何 preferences 里的 URL 在渲染前必须过这里。
 */
function sanitizeExternalUrl(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    // 允许相对路径（以 / 开头），直接放行
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
    const u = new URL(trimmed);
    if (
      u.protocol === "http:" ||
      u.protocol === "https:" ||
      u.protocol === "mailto:"
    ) {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 从 leaderboard JSON 按 githubId 匹配贡献记录。
 * 之前按 name 字符串匹配会踩坑（leaderboard.name = "longsizhuo"，user_accounts.username = "github_114939201"），
 * 现在按 githubId 数字匹配直接对齐。
 */
function findContributions(githubId: number | null | undefined) {
  if (githubId == null)
    return { docs: [], points: 0, commits: 0, dailyCounts: {} };
  type Row = {
    id: string;
    name: string;
    points?: number;
    commits?: number;
    avatarUrl?: string;
    contributedDocs?: Array<{ id: string; title: string; url: string }>;
    dailyCounts?: Record<string, number>;
  };
  // 先经 unknown 再转 Row[]：JSON 的字面量类型（每条 dailyCounts 都是独立的 literal）和 Row 的
  // Record<string, number> 索引签名不兼容，tsc --noEmit 会报 TS2352。先走 unknown 绕开。
  const rows = leaderboard as unknown as Row[];
  const idStr = String(githubId);
  const match = rows.find((r) => r.id === idStr);
  if (!match) return { docs: [], points: 0, commits: 0, dailyCounts: {} };
  return {
    docs: match.contributedDocs ?? [],
    points: match.points ?? 0,
    commits: match.commits ?? 0,
    dailyCounts: match.dailyCounts ?? {},
  };
}

interface Param {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Param): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchProfile(username);
  if (!data) return { title: `@${username}` };
  const displayName = data.user.displayName || data.user.username;
  return {
    title: `${displayName} (@${data.user.username})`,
    description:
      data.preferences?.bio ||
      `${displayName} 在 Involution Hell 的个人主页 — 项目、论文与文档贡献。`,
  };
}

export default async function UserProfilePage({ params }: Param) {
  const { username } = await params;
  const data = await fetchProfile(username);
  if (!data) notFound();

  const t = await getServerT();
  const { user } = data;
  const preferences = data.preferences ?? {};
  const { docs, points, commits, dailyCounts } = findContributions(
    user.githubId,
  );
  const projects = preferences.projects ?? [];
  const rawPapers = preferences.pinned_papers ?? [];
  const links = preferences.links ?? [];

  // 用 itemKey 批量拉 Zotero 元信息 → 用它填字段，覆盖手填值（手填作为离线 fallback）
  const zoteroKeys = rawPapers
    .map((p) => p.itemKey)
    .filter((k): k is string => typeof k === "string" && k.length > 0);
  const zoteroMap = await fetchZoteroByKeys(zoteroKeys);
  const papers: UserPaperItem[] = rawPapers.map((p) => {
    if (!p.itemKey) return p;
    const z = zoteroMap[p.itemKey];
    if (!z) return p; // Zotero 拉不到就用手填值兜底
    return {
      itemKey: p.itemKey,
      title: p.title || z.title,
      authors: p.authors || z.authors,
      year: p.year || z.year,
      url: p.url || z.url,
      abstract: p.abstract || z.abstractNote,
    };
  });

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-12">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  {t("profile.dossier")} ·{" "}
                  {t("profile.volumeIssue", { id: user.id })}
                </div>
                <h2 className="font-serif text-4xl md:text-5xl font-black uppercase mt-2 tracking-tight text-[var(--foreground)]">
                  {user.displayName || user.username}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {/* 编辑入口：只有本人登录状态下才显示；访问者判定由 EditProfileForm 内部做，
                    这里不做服务端鉴权，因为 satoken 存 localStorage，SSR 拿不到用户 */}
                <EditLinkIfOwner
                  ownerGithubId={user.githubId ?? null}
                  ownerUsername={user.username}
                  identifier={username}
                />
                <Link
                  href="/rank"
                  className="font-mono text-[11px] uppercase tracking-widest hover:text-[#CC0000] transition-colors flex items-center gap-1"
                >
                  {t("profile.fullRank")}
                </Link>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* 左大块：Identity */}
            <section className="col-span-12 lg:col-span-5 border border-[var(--foreground)] p-8 lg:p-10 flex flex-col gap-6 self-start">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                {t("profile.sec.profile")}
              </span>
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={96}
                  height={96}
                  className="border-2 border-[var(--foreground)]"
                />
              ) : (
                <div className="w-24 h-24 border-2 border-[var(--foreground)] flex items-center justify-center font-serif text-3xl font-black">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-serif text-4xl font-black italic leading-none text-[var(--foreground)]">
                  {user.displayName || user.username}
                </h1>
                <p className="font-mono text-xs text-neutral-500 mt-1">
                  @{user.username}
                </p>
                {preferences.tagline && (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    {preferences.tagline}
                  </p>
                )}
              </div>
              {preferences.bio && (
                <p className="border-t border-[var(--foreground)] pt-4 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {preferences.bio}
                </p>
              )}
              <div className="border-t border-[var(--foreground)] pt-4 grid grid-cols-3 gap-4">
                <Stat label={t("profile.stats.docs")} value={docs.length} />
                <Stat label={t("profile.stats.commits")} value={commits} />
                <Stat label={t("profile.stats.points")} value={points} />
              </div>
              {/* 关注按钮 + 粉丝/关注数，客户端动态拉 */}
              <FollowButton identifier={username} targetUserId={user.id} />
              {links.length > 0 && (
                <div className="border-t border-[var(--foreground)] pt-4 flex flex-wrap gap-2">
                  {links.slice(0, 5).map((link, idx) => {
                    // 过滤 javascript: / data: 等危险 scheme，不合法直接渲染成不可点击的纯文本
                    const safe = sanitizeExternalUrl(link.url);
                    if (!safe) {
                      return (
                        <span
                          key={`${link.label}-${idx}`}
                          className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-dashed border-neutral-400 text-neutral-400"
                          title="链接协议不安全，已禁用"
                        >
                          {link.label}
                        </span>
                      );
                    }
                    return (
                      <a
                        key={safe}
                        href={safe}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                      >
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 右侧小卡区 */}
            <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {projects.map((p, idx) => (
                <ProfileCard
                  key={`proj-${idx}`}
                  kind="PROJ"
                  index={idx + 1}
                  title={p.title}
                  meta={p.tags?.join(" · ")}
                  summary={p.description}
                  detail={p.description}
                  href={sanitizeExternalUrl(p.url) ?? undefined}
                />
              ))}
              {papers.map((p, idx) => (
                <ProfileCard
                  key={`paper-${idx}`}
                  kind="PAPER"
                  index={idx + 1}
                  // title 在 UserPaperItem 里允许 itemKey-only（title 可能缺），这里兜底
                  title={p.title || p.itemKey || "(untitled paper)"}
                  meta={[p.authors, p.year].filter(Boolean).join(", ")}
                  summary={p.abstract}
                  detail={p.abstract}
                  href={sanitizeExternalUrl(p.url) ?? undefined}
                />
              ))}
              {projects.length === 0 && papers.length === 0 && (
                <div className="col-span-full border border-dashed border-[var(--foreground)] p-10 text-center text-neutral-500 font-sans text-sm leading-relaxed">
                  {t("profile.empty.title")}
                  <br />
                  <span className="text-xs text-neutral-400">
                    {t("profile.empty.subtitle")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 活跃度热力图：提到 Bento 之后立即显示，让数据可视化先于冗长的列表 */}
          {Object.keys(dailyCounts).length > 0 && (
            <div className="mt-12">
              <ActivityHeatmap dailyCounts={dailyCounts} />
            </div>
          )}

          {/* GitHub 公开 repos：server component 内部 fetch，零数据时自动返回 null */}
          <div className="mt-12">
            <GithubRepos identifier={username} />
          </div>

          {/* 文档贡献列表：放最底部，紧凑列表形式（每行 ~48px），避免 docs 多的用户把页面顶得很长。
              超过 10 条时用 <details> 折叠，默认只显示前 10 */}
          {docs.length > 0 && (
            <section className="mt-12 border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-[var(--foreground)] pb-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    {t("docs.sec")}
                  </div>
                  <h3 className="font-serif text-xl font-black uppercase mt-1 text-[var(--foreground)]">
                    {t("docs.heading")}
                  </h3>
                </div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {t("docs.count", {
                    n: docs.length,
                    commits: commits.toLocaleString(),
                  })}
                </div>
              </div>
              <ol className="flex flex-col">
                {docs.slice(0, 10).map((doc, idx) => (
                  <DocRow key={doc.id} idx={idx + 1} doc={doc} />
                ))}
              </ol>
              {docs.length > 10 && (
                <details className="flex flex-col">
                  <summary className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000] cursor-pointer hover:underline py-2">
                    {t("docs.showMore", { n: docs.length - 10 })}
                  </summary>
                  <ol className="flex flex-col mt-2">
                    {docs.slice(10).map((doc, idx) => (
                      <DocRow key={doc.id} idx={idx + 11} doc={doc} />
                    ))}
                  </ol>
                </details>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** 紧凑单行文档条目 */
function DocRow({
  idx,
  doc,
}: {
  idx: number;
  doc: { id: string; title: string; url: string };
}) {
  const safe = sanitizeExternalUrl(doc.url);
  return (
    <li className="flex items-baseline gap-3 border-t border-[var(--foreground)]/20 first:border-t-0 py-2 group">
      <span className="font-mono text-[10px] text-neutral-400 w-6 shrink-0">
        {String(idx).padStart(2, "0")}
      </span>
      {safe ? (
        <Link
          href={safe}
          className="flex-1 font-serif text-sm text-[var(--foreground)] truncate group-hover:text-[#CC0000] transition-colors"
        >
          {doc.title}
        </Link>
      ) : (
        <span className="flex-1 font-serif text-sm text-neutral-400 truncate">
          {doc.title}
        </span>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-serif text-2xl font-black text-[var(--foreground)]">
        {value.toLocaleString()}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mt-1">
        {label}
      </div>
    </div>
  );
}
