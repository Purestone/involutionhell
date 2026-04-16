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
  title: string;
  authors?: string;
  year?: string | number;
  url?: string;
  abstract?: string;
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
 * 贡献文档不走后端 DB，而是在组件里从 build-time 的 site-leaderboard.json 读取，
 * 目的：每次访问 /u/{x} 省一次 Neon 查询（免费额度有限）。docs 本来就是 git-based，
 * JSON 新鲜度和 DB 一致，都是 deploy 级。
 */
async function fetchProfile(identifier: string): Promise<ProfileData | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const res = await fetch(
      `${backendUrl}/api/user-center/profile/${encodeURIComponent(identifier)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as ProfileResponse;
    if (!json.success || !json.data) return null;
    return json.data;
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
  const rows = leaderboard as Row[];
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

  const { user } = data;
  const preferences = data.preferences ?? {};
  const { docs, points, commits, dailyCounts } = findContributions(
    user.githubId,
  );
  const projects = preferences.projects ?? [];
  const papers = preferences.pinned_papers ?? [];
  const links = preferences.links ?? [];

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-12">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  User Dossier · Vol. 1 Issue {user.id}
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
                  Full Rank →
                </Link>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* 左大块：Identity */}
            <section className="col-span-12 lg:col-span-5 border border-[var(--foreground)] p-8 lg:p-10 flex flex-col gap-6 self-start">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                SEC. PROFILE · 001
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
                <Stat label="文档贡献" value={docs.length} />
                <Stat label="累计 Commits" value={commits} />
                <Stat label="积分" value={points} />
              </div>
              {links.length > 0 && (
                <div className="border-t border-[var(--foreground)] pt-4 flex flex-wrap gap-2">
                  {links.slice(0, 5).map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
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
                  href={p.url}
                />
              ))}
              {papers.map((p, idx) => (
                <ProfileCard
                  key={`paper-${idx}`}
                  kind="PAPER"
                  index={idx + 1}
                  title={p.title}
                  meta={[p.authors, p.year].filter(Boolean).join(", ")}
                  summary={p.abstract}
                  detail={p.abstract}
                  href={p.url}
                />
              ))}
              {docs.slice(0, 8).map((doc, idx) => (
                <ProfileCard
                  key={`doc-${doc.id}`}
                  kind="DOC"
                  index={idx + 1}
                  title={doc.title}
                  meta={`文档 · ${doc.id.slice(0, 8)}`}
                  summary={doc.url}
                  detail={`标题：${doc.title}\n路径：${doc.url}`}
                  href={doc.url}
                />
              ))}
              {projects.length === 0 &&
                papers.length === 0 &&
                docs.length === 0 && (
                  <div className="col-span-full border border-dashed border-[var(--foreground)] p-10 text-center text-neutral-500 font-mono text-sm">
                    该用户还没有填写 projects / papers，也没有文档贡献记录。
                  </div>
                )}
            </div>
          </div>

          {/* 活跃度热力图：Bento 下方独立一行全宽，仅当有贡献数据时显示 */}
          {Object.keys(dailyCounts).length > 0 && (
            <div className="mt-12">
              <ActivityHeatmap dailyCounts={dailyCounts} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
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
