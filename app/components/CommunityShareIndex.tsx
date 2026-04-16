import { source } from "@/lib/source";
import Link from "next/link";

/**
 * CommunityShare 自动目录索引（Server Component，渲染在 /docs/CommunityShare/index.mdx 内）。
 *
 * 为什么需要这个组件：
 * 原先 index.mdx 里的分类列表是人工维护的 Markdown，每次新增文章 / 新增分类都要顺手改索引，
 * 实际上经常漏（main 上 index.mdx 少列了 Amazing-AI-Tools / Language / Leetcode / Life /
 * Personal-Study-Notes 五个分类，还留着"身体健康"这种完全空的占位分类）。
 * 改成 server 组件从 fumadocs `source.getPages()` 实时读目录树 → 文档增删后索引自动同步，
 * 不再需要 #110 那种靠脚本定期重新生成 MDX 的方案（也就不需要引入 glob / gray-matter 依赖）。
 *
 * 设计：
 * - 顶级分类 = CommunityShare 下的直属一级目录
 * - 每个分类的标题：优先读该分类 index.mdx 的 frontmatter.title；没 index 就用目录名兜底
 * - 分类内的文章按 title 字母排序，排除分类自己的 index.mdx（避免"点击进入自己"的死循环）
 * - 翻译版（lang === "en" 或文件名以 .en 结尾）不出现在列表，统一走原文 URL，locale 由 cookie 切
 * - 分类条目超过 INLINE_LIMIT (12) 时折叠显示："共 N 篇 → 进入分类" 单行链接，
 *   避免 Leetcode 这种几十上百篇的分类把页面顶爆
 * - 完全不指向 "/docs/CommunityShare/<dir>" 硬拼 URL，全部走 page.url（fumadocs 已做 slug 规范化
 *   和拼音转换，硬拼会漏掉 lib/source.ts 里 Leetcode 目录的 pinyin slug transform）
 */

type PageLike = ReturnType<typeof source.getPages>[number];

const ROOT = "CommunityShare";
const INLINE_LIMIT = 12;

/** 判定一个页面是不是英文翻译版（不应出现在索引里） */
function isEnglishVariant(page: PageLike): boolean {
  const data = page.data as { lang?: string };
  if (data.lang === "en") return true;
  // 兜底：历史上有未加 lang frontmatter 的 .en.mdx 文件，靠文件名识别
  return page.file.name.endsWith(".en");
}

/** 取页面 file.path 相对 ROOT 的第一级目录名，如 "CommunityShare/Geek/foo" → "Geek" */
function firstSegmentUnderRoot(filePath: string): string | null {
  const prefix = `${ROOT}/`;
  if (!filePath.startsWith(prefix)) return null;
  const rest = filePath.slice(prefix.length);
  const slashIdx = rest.indexOf("/");
  return slashIdx === -1 ? null : rest.slice(0, slashIdx);
}

export function CommunityShareIndex() {
  const all = source.getPages();

  // 第一步：筛出 CommunityShare 下的全部非英文版页面
  const pages = all.filter(
    (p) => p.file.path.startsWith(`${ROOT}/`) && !isEnglishVariant(p),
  );

  // 第二步：按第一级子目录分组（根目录的 index.mdx 本身 category=null，跳过）
  const byCategory = new Map<string, PageLike[]>();
  for (const page of pages) {
    const category = firstSegmentUnderRoot(page.file.path);
    if (!category) continue;
    const bucket = byCategory.get(category) ?? [];
    bucket.push(page);
    byCategory.set(category, bucket);
  }

  // 第三步：构造渲染所需的 view-model，并按分类名排序
  const categories = [...byCategory.entries()]
    .map(([dirName, catPages]) => {
      // 分类自己的 index.mdx（若存在）
      const categoryIndex = catPages.find(
        (p) =>
          p.file.dirname === `${ROOT}/${dirName}` && p.file.name === "index",
      );
      const displayTitle = categoryIndex?.data.title ?? dirName;
      const categoryUrl = categoryIndex?.url ?? `/docs/${ROOT}/${dirName}`;

      // 内容条目 = 排除分类 index 本身
      const entries = catPages
        .filter((p) => p !== categoryIndex)
        .sort((a, b) => a.data.title.localeCompare(b.data.title, "zh-Hans-CN"));

      return {
        dirName,
        displayTitle,
        categoryUrl,
        entries,
      };
    })
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle, "zh-Hans-CN"));

  if (categories.length === 0) {
    // 兜底：理论上不会走到，但避免开发期目录清空时整个页面报错
    return (
      <p className="text-sm text-neutral-500">暂无分享内容，期待你的投稿！</p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {categories.map((cat) => (
        <section key={cat.dirName}>
          <h2 className="text-xl font-bold mb-3">
            <Link href={cat.categoryUrl} className="hover:underline">
              {cat.displayTitle}
            </Link>
            <span className="ml-2 text-xs font-normal text-neutral-500">
              ({cat.entries.length} 篇)
            </span>
          </h2>
          {cat.entries.length > INLINE_LIMIT ? (
            // 超过阈值：折叠显示，避免 Leetcode 这种分类把页面顶爆
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <Link
                href={cat.categoryUrl}
                className="text-[var(--color-fd-primary)] hover:underline"
              >
                查看全部 {cat.entries.length} 篇 →
              </Link>
            </p>
          ) : (
            <ul className="list-disc pl-6 space-y-1">
              {cat.entries.map((p) => (
                <li key={p.url}>
                  <Link href={p.url} className="hover:underline">
                    {p.data.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
