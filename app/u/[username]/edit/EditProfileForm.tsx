"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

interface LinkItem {
  label: string;
  url: string;
}

interface ProjectItem {
  title: string;
  description: string;
  url: string;
  tags: string[];
}

interface PaperItem {
  /** Zotero group item key；填了之后 profile 页会自动拉 Zotero 元信息填充 */
  itemKey: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  abstract: string;
}

interface Preferences {
  bio: string;
  tagline: string;
  links: LinkItem[];
  projects: ProjectItem[];
  pinned_papers: PaperItem[];
}

const EMPTY_PREFS: Preferences = {
  bio: "",
  tagline: "",
  links: [],
  projects: [],
  pinned_papers: [],
};

/**
 * 从 localStorage 读 satoken。SSR 下返回 null。
 */
function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("satoken");
  } catch {
    return null;
  }
}

/**
 * 把后端 preferences JSON 规范化成表单 state。允许部分字段缺失。
 */
function normalize(raw: unknown): Preferences {
  const p = (raw as Partial<Preferences>) ?? {};
  return {
    bio: typeof p.bio === "string" ? p.bio : "",
    tagline: typeof p.tagline === "string" ? p.tagline : "",
    links: Array.isArray(p.links)
      ? p.links.map((l) => ({
          label: l?.label ?? "",
          url: l?.url ?? "",
        }))
      : [],
    projects: Array.isArray(p.projects)
      ? p.projects.map((x) => ({
          title: x?.title ?? "",
          description: x?.description ?? "",
          url: x?.url ?? "",
          tags: Array.isArray(x?.tags) ? x.tags : [],
        }))
      : [],
    pinned_papers: Array.isArray(p.pinned_papers)
      ? p.pinned_papers.map((x) => ({
          itemKey: x?.itemKey ?? "",
          title: x?.title ?? "",
          authors: x?.authors ?? "",
          year: String(x?.year ?? ""),
          url: x?.url ?? "",
          abstract: x?.abstract ?? "",
        }))
      : [],
  };
}

interface Props {
  /** 来自 URL 的 /u/[username]，用来验证访问者是不是本人 */
  targetIdentifier: string;
}

/**
 * 编辑个人主页客户端表单。
 * - 用 useAuth 读当前用户 → 判断是否是本人；不是就直接拒绝
 * - 初始化时 GET /api/user-center/preferences 填入已有值
 * - 提交时 PATCH /api/user-center/preferences（顶层 key 原子合并）
 */
export function EditProfileForm({ targetIdentifier }: Props) {
  const { user, status } = useAuth();
  const router = useRouter();

  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 仅本人可编辑：URL username 需要能匹配到当前用户（数字 github_id 或字符串 username）
  const isOwner = (() => {
    if (!user) return false;
    if (user.username === targetIdentifier) return true;
    if (user.githubId != null && String(user.githubId) === targetIdentifier)
      return true;
    return false;
  })();

  useEffect(() => {
    if (status !== "authenticated" || !isOwner) {
      setLoading(false);
      return;
    }
    const token = readToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch("/api/user-center/preferences", {
      headers: { satoken: token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success) setPrefs(normalize(json.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, isOwner]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const token = readToken();
    if (!token) {
      setMessage("未检测到登录 token，请重新登录");
      setSaving(false);
      return;
    }
    // 后端 PATCH 是顶层 key 合并，这里直接把整个 prefs 扁平覆盖掉前端展示的字段
    const body = {
      bio: prefs.bio,
      tagline: prefs.tagline,
      links: prefs.links.filter((l) => l.label && l.url),
      projects: prefs.projects.filter((p) => p.title),
      // 有 itemKey 或有 title 的条目保留，至少得有一个标识符
      pinned_papers: prefs.pinned_papers.filter((p) => p.itemKey || p.title),
    };
    try {
      const res = await fetch("/api/user-center/preferences", {
        method: "PATCH",
        headers: {
          satoken: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setMessage(`保存失败：HTTP ${res.status}`);
      } else {
        setMessage("已保存，返回主页...");
        setTimeout(() => {
          // 跳回自己的个人主页，用 githubId 作为 canonical URL
          const id = user?.githubId ?? user?.username;
          if (id) router.push(`/u/${id}`);
        }, 600);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存出错");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return <p className="font-mono text-sm text-neutral-500">正在加载...</p>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="border border-[var(--foreground)] p-8">
        <p className="font-mono text-sm mb-4">需要登录后才能编辑个人主页。</p>
        <Link
          href="/login"
          className="inline-block font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          Sign In →
        </Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="border border-[var(--foreground)] p-8">
        <p className="font-mono text-sm">
          这不是你的主页（URL 标识 <code>{targetIdentifier}</code>），
          只有本人可以编辑。
        </p>
        <Link
          href={`/u/${user?.githubId ?? user?.username}`}
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest hover:text-[#CC0000]"
        >
          去我的主页 →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      {/* 编辑页顶部总说明：告诉用户这个页面都干什么 */}
      <div className="border border-[var(--foreground)] bg-[var(--background)] p-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
          About this page
        </div>
        <p>
          这里填的内容会显示在你的个人主页{" "}
          <code className="font-mono text-[#CC0000]">
            /u/{user?.githubId ?? user?.username ?? "你"}
          </code>{" "}
          上，让别人知道你是谁、做什么、在读什么。全部字段都是
          <strong> 可选</strong>，填哪个显示哪个；不填主页就只显示 GitHub
          基础信息 + 贡献统计。
        </p>
      </div>

      {/* Section 1: 基础 */}
      <Section
        title="SEC. 01 · IDENTITY"
        heading="关于你自己"
        description="一句小标题 + 一段自我介绍，会显示在主页左侧大块最上方。相当于你在站内的名片。"
      >
        <Field label="一句话标签（tagline，80 字以内）">
          <input
            type="text"
            value={prefs.tagline}
            onChange={(e) => setPrefs({ ...prefs, tagline: e.target.value })}
            maxLength={80}
            placeholder="比如：LLM Safety 方向 · UNSW 在读 / 全栈搞着玩 / 找暑期实习中"
            className="w-full border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-sm"
          />
        </Field>
        <Field label="自我介绍（bio，80-200 字较合适）">
          <textarea
            value={prefs.bio}
            onChange={(e) => setPrefs({ ...prefs, bio: e.target.value })}
            rows={4}
            maxLength={500}
            placeholder="你是谁、在做什么、感兴趣的方向。举例：我是 xxx，读研在做 LLM 对齐，平时写写文档和小工具。想认识做 RLHF / 评估 / infra 的朋友。"
            className="w-full border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-serif text-sm leading-relaxed resize-y"
          />
        </Field>
      </Section>

      {/* Section 2: Links */}
      <Section
        title="SEC. 02 · LINKS"
        heading="外部链接"
        description="想让大家跟你联系 / 了解你的其他地方。最多 5 条，会显示在主页左侧大块底部，以小按钮形式展示。"
      >
        <RepeatableList
          items={prefs.links}
          onChange={(items) => setPrefs({ ...prefs, links: items })}
          empty={{ label: "", url: "" }}
          maxItems={5}
          render={(item, idx, update) => (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
              <input
                type="text"
                value={item.label}
                onChange={(e) => update({ ...item, label: e.target.value })}
                placeholder="按钮上显示的字，如 Blog / Twitter / 知乎"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs uppercase"
              />
              <input
                type="url"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value })}
                placeholder="https://your-blog.com"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
            </div>
          )}
        />
      </Section>

      {/* Section 3: Projects */}
      <Section
        title="SEC. 03 · PROJECTS"
        heading="你自己的项目"
        description="想展示的个人项目 / 玩具 / 开源作品。GitHub 公开 repos 会自动出现在主页底部，这里填 GitHub 里没有或想单独强调的。最多 8 条。"
      >
        <RepeatableList
          items={prefs.projects}
          onChange={(items) => setPrefs({ ...prefs, projects: items })}
          empty={{ title: "", description: "", url: "", tags: [] }}
          maxItems={8}
          render={(item, idx, update) => (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => update({ ...item, title: e.target.value })}
                placeholder="项目名，如 involutionhell.com"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-serif text-sm font-bold"
              />
              <textarea
                value={item.description}
                onChange={(e) =>
                  update({ ...item, description: e.target.value })
                }
                rows={2}
                placeholder="一两句说明做了什么、解决什么问题。hover 时会展开显示"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-sans text-xs resize-y"
              />
              <input
                type="url"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value })}
                placeholder="项目链接（GitHub repo / 产品首页）"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
              <input
                type="text"
                value={item.tags.join(", ")}
                onChange={(e) =>
                  update({
                    ...item,
                    tags: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="技术栈标签，逗号分隔。例如 TypeScript, Next.js, LLM"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
            </div>
          )}
        />
      </Section>

      {/* Section 4: Papers — 重命名为"最近在读 / 推荐的论文"，用户更能理解 */}
      <Section
        title="SEC. 04 · PAPERS"
        heading="最近在读 / 推荐的论文"
        description="你最近读到觉得值得分享的论文（学术 / 技术博客都行）。可以填 Zotero itemKey 自动补齐信息，也可以手动填标题作者年份。不是必填，没有就留空。"
      >
        <RepeatableList
          items={prefs.pinned_papers}
          onChange={(items) => setPrefs({ ...prefs, pinned_papers: items })}
          empty={{
            itemKey: "",
            title: "",
            authors: "",
            year: "",
            url: "",
            abstract: "",
          }}
          maxItems={8}
          render={(item, idx, update) => (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={item.itemKey}
                onChange={(e) => update({ ...item, itemKey: e.target.value })}
                placeholder="Zotero itemKey（可选，填了会自动拉元信息；不填就手填下面字段）"
                className="border border-dashed border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs uppercase tracking-wider"
              />
              <input
                type="text"
                value={item.title}
                onChange={(e) => update({ ...item, title: e.target.value })}
                placeholder="论文标题"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-serif text-sm font-bold"
              />
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
                <input
                  type="text"
                  value={item.authors}
                  onChange={(e) => update({ ...item, authors: e.target.value })}
                  placeholder="作者（Alice, Bob）"
                  className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
                />
                <input
                  type="text"
                  value={item.year}
                  onChange={(e) => update({ ...item, year: e.target.value })}
                  placeholder="年份"
                  className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
                />
              </div>
              <input
                type="url"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value })}
                placeholder="链接"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
              <textarea
                value={item.abstract}
                onChange={(e) => update({ ...item, abstract: e.target.value })}
                rows={2}
                placeholder="摘要或一句话评价"
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-sans text-xs resize-y"
              />
            </div>
          )}
        />
      </Section>

      {/* 提交 */}
      <div className="flex items-center gap-4 border-t-2 border-[var(--foreground)] pt-6">
        <button
          type="submit"
          disabled={saving}
          className="font-mono text-xs uppercase tracking-widest px-6 py-3 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "保存 →"}
        </button>
        <Link
          href={`/u/${user?.githubId ?? user?.username}`}
          className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-[var(--foreground)]"
        >
          取消
        </Link>
        {message && (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  heading,
  description,
  children,
}: {
  /** 左上角的 SEC 编号，全大写英文 */
  title: string;
  /** 大号中文标题，让用户一眼知道这是什么 */
  heading: string;
  /** 一两句话解释这块填什么、填了之后主页哪里会显示 */
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
      <header className="border-b border-[var(--foreground)] pb-3 flex flex-col gap-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          {title}
        </div>
        <h2 className="font-serif text-xl font-black text-[var(--foreground)]">
          {heading}
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * 通用可增删列表（links / projects / papers 共用）。
 * 用泛型保证 items 和 empty / render 类型一致。
 */
function RepeatableList<T>({
  items,
  onChange,
  empty,
  maxItems,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  maxItems: number;
  render: (
    item: T,
    index: number,
    update: (next: T) => void,
  ) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="border border-dashed border-[var(--foreground)] p-4 flex flex-col gap-3"
        >
          {render(item, idx, (next) => {
            const copy = [...items];
            copy[idx] = next;
            onChange(copy);
          })}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="self-end font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[#CC0000]"
          >
            删除此项
          </button>
        </div>
      ))}
      {items.length < maxItems && (
        <button
          type="button"
          onClick={() => onChange([...items, empty])}
          className="self-start font-mono text-[10px] uppercase tracking-widest px-3 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          + 新增
        </button>
      )}
    </div>
  );
}
