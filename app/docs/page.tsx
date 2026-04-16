import { source } from "@/lib/source";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { Card, Cards } from "fumadocs-ui/components/card";
import type { PageTree } from "fumadocs-core/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";

/**
 * /docs 根路由的 landing 页。
 *
 * 为什么需要这个文件：
 * - Header 导航栏 "文档 / Docs" 直接指向 /docs
 * - 但路由目录下只有 app/docs/[...slug]/page.tsx（catch-all，不匹配空 slug）和 layout.tsx，
 *   没有任何东西匹配 /docs 本身 → 用户点导航就 404
 * - 修法：加这个 server component，复用 app/docs/layout.tsx 里已经挂好的 DocsLayout
 *   （侧边栏 + copy tracking + view tracking 都继承下来），自己只负责渲染中间内容区
 *
 * 内容策略：
 * - 不硬编码 ai / computer-science / ... 这些分区，直接读 source.pageTree 顶层 children
 *   → 以后新增分区（比如又搞一个 "research-logs" 目录）landing 自动带上
 * - 卡片标题 / 描述用分区 index.mdx 的 frontmatter.title / description
 *   没 index 的分区降级用目录名 + 空描述（jobs / all-projects 目前就是这个情况）
 * - 仅从 cookie 读 locale 用于 H1/intro 的中英切换；卡片内容来自 frontmatter 本身，
 *   所以已经由 [...slug] 的 locale fallback 负责，这里不重复处理
 */

type FolderNode = Extract<PageTree.Node, { type: "folder" }>;
type PageNode = Extract<PageTree.Node, { type: "page" }>;

interface SectionCard {
  title: string;
  description?: string;
  href: string;
}

async function getLocaleFromCookie(): Promise<"zh" | "en"> {
  const cookieStore = await cookies();
  const val = cookieStore.get("locale")?.value;
  return val === "en" ? "en" : "zh";
}

/** 把 pageTree 顶层 node 映射成 landing 卡片；遇到 separator / 孤立 page 就跳过 */
function toSectionCard(node: PageTree.Node): SectionCard | null {
  if (node.type === "separator") return null;
  if (node.type === "page") {
    // 顶层直接挂的文件（比如目录只有一个文件被 pruneEmptyFolders 提出来了）
    const pageNode = node as PageNode;
    return {
      title: asPlainText(pageNode.name),
      description: pageNode.description
        ? asPlainText(pageNode.description)
        : undefined,
      href: pageNode.url,
    };
  }
  // folder 分支
  const folder = node as FolderNode;
  const indexUrl = folder.index?.url;
  // folder 没 index 时指向它第一个 page 后代，保证 landing 上点击不落空
  const fallbackUrl =
    indexUrl ?? findFirstPageUrl(folder.children) ?? undefined;
  if (!fallbackUrl) return null;
  return {
    title: asPlainText(folder.name),
    description: folder.index?.description
      ? asPlainText(folder.index.description)
      : undefined,
    href: fallbackUrl,
  };
}

/** 深度优先找出子树中第一个 page 的 url，folder 没 index 时用来兜底 */
function findFirstPageUrl(children: PageTree.Node[]): string | null {
  for (const child of children) {
    if (child.type === "page") return (child as PageNode).url;
    if (child.type === "folder") {
      const folder = child as FolderNode;
      if (folder.index) return folder.index.url;
      const nested = findFirstPageUrl(folder.children);
      if (nested) return nested;
    }
  }
  return null;
}

/** PageTree 里 name / description 可能是 string 或 ReactNode，这里只取纯文本兜底 */
function asPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  // ReactNode 情况：回退成占位，实际项目里所有 frontmatter 都是 string
  return String(value);
}

export default async function DocsRootPage() {
  const locale = await getLocaleFromCookie();
  const tree = source.pageTree;

  const cards = tree.children
    .map(toSectionCard)
    .filter((c): c is SectionCard => c !== null);

  // 文案双语：和其它翻译组件不同的是，这里内容极少，直接内联 literal 比接 next-intl 轻
  const heading = locale === "en" ? "Knowledge Base" : "文档总览";
  const intro =
    locale === "en"
      ? "Pick a section to dive in. Everything here is community-contributed and Git-based — edits flow through pull requests."
      : "从下面任意一个分区进入。所有内容都来自社区贡献，基于 Git 管理，修改走 Pull Request 流程。";

  return (
    <DocsPage>
      <DocsBody>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl mb-4">
          {heading}
        </h1>
        <p className="text-base text-fd-muted-foreground mb-8">{intro}</p>
        <Cards>
          {cards.map((c) => (
            <Card
              key={c.href}
              title={c.title}
              href={c.href}
              description={c.description}
            />
          ))}
        </Cards>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return {
    title: locale === "en" ? "Docs" : "文档",
    description:
      locale === "en"
        ? "Involution Hell community knowledge base — AI, CS, jobs, community shares."
        : "Involution Hell 社区知识库 — AI、计算机基础、求职、群友分享等分区总览。",
  };
}
