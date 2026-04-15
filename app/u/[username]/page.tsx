import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import leaderboard from "@/generated/site-leaderboard.json";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { ProfileCard } from "./ProfileCard";

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

interface ProfileResponse {
  success: boolean;
  data?: {
    user: UserView;
    preferences: Preferences;
  };
  message?: string;
}

/**
 * SSR 获取用户主页数据。匿名请求，走 Next rewrite 到 Java 后端。
 * 失败或 404 返回 null，让页面走 notFound()。
 */
async function fetchProfile(
  username: string,
): Promise<ProfileResponse["data"] | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const res = await fetch(
      `${backendUrl}/api/user-center/profile/${encodeURIComponent(username)}`,
      // 用户主页数据变化慢（preferences 手动编辑），缓 5 分钟已足够
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
 * 在 leaderboard JSON 里按 name（GitHub login）匹配贡献文档列表。
 * leaderboard 脚本跑在 build 时，所以这里是静态数据。
 */
function findContributedDocs(username: string) {
  type Row = {
    name: string;
    points?: number;
    commits?: number;
    contributedDocs?: Array<{ title: string; url: string }>;
  };
  const rows = leaderboard as Row[];
  const match = rows.find(
    (r) => r.name.toLowerCase() === username.toLowerCase(),
  );
  if (!match) return { docs: [], points: 0, commits: 0 };
  return {
    docs: match.contributedDocs ?? [],
    points: match.points ?? 0,
    commits: match.commits ?? 0,
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
      data.preferences.bio ||
      `${displayName} 在 Involution Hell 的个人主页 — 项目、论文与文档贡献。`,
  };
}

export default async function UserProfilePage({ params }: Param) {
  const { username } = await params;
  const data = await fetchProfile(username);
  if (!data) notFound();

  const { docs, points, commits } = findContributedDocs(data.user.username);
  const { preferences } = data;
  const projects = preferences.projects ?? [];
  const papers = preferences.pinned_papers ?? [];
  const links = preferences.links ?? [];

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section header（和站内其他模块视觉对齐） */}
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-12">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  User Dossier · Vol. 1 Issue {data.user.id}
                </div>
                <h2 className="font-serif text-4xl md:text-5xl font-black uppercase mt-2 tracking-tight text-[var(--foreground)]">
                  {data.user.displayName || data.user.username}
                </h2>
              </div>
              <Link
                href="/rank"
                className="font-mono text-[11px] uppercase tracking-widest hover:text-[#CC0000] transition-colors flex items-center gap-1"
              >
                Full Rank →
              </Link>
            </div>
          </header>

          {/* Bento 12-col grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* 左大块：Identity */}
            <section className="col-span-12 lg:col-span-5 border border-[var(--foreground)] p-8 lg:p-10 flex flex-col gap-6 self-start">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                SEC. PROFILE · 001
              </span>
              {data.user.avatarUrl ? (
                <Image
                  src={data.user.avatarUrl}
                  alt={data.user.username}
                  width={96}
                  height={96}
                  className="border-2 border-[var(--foreground)]"
                />
              ) : (
                <div className="w-24 h-24 border-2 border-[var(--foreground)] flex items-center justify-center font-serif text-3xl font-black">
                  {data.user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-serif text-4xl font-black italic leading-none text-[var(--foreground)]">
                  {data.user.displayName || data.user.username}
                </h1>
                <p className="font-mono text-xs text-neutral-500 mt-1">
                  @{data.user.username}
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
              {docs.length > 0 && (
                <ProfileCard
                  kind="DOC"
                  index={1}
                  title={`文档贡献 · ${docs.length} 篇`}
                  meta={`最近 ${Math.min(docs.length, 5)} 篇`}
                  summary={docs
                    .slice(0, 3)
                    .map((d) => d.title)
                    .join(" · ")}
                  detail={docs
                    .slice(0, 5)
                    .map((d) => d.title)
                    .join("\n")}
                  href="/rank"
                  // DOC 卡占满一行（span-2），其他卡片 gridAutoFlow 自动填充
                  spanFull
                />
              )}
              {projects.length === 0 &&
                papers.length === 0 &&
                docs.length === 0 && (
                  <div className="col-span-full border border-dashed border-[var(--foreground)] p-10 text-center text-neutral-500 font-mono text-sm">
                    该用户还没有填写 projects / papers，也没有文档贡献记录。
                  </div>
                )}
            </div>
          </div>
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
