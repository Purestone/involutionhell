import { docs } from "@/.source";
import { loader, getSlugs } from "fumadocs-core/source";
import { pinyin } from "pinyin-pro";

// 拼音转换工具，仅针对中文部分转换，保留原本的标点和数字
function convertSlugToPinyin(text: string) {
  // 核心修复点：Fumadocs 内部生成的 slugs 可能是被 encode 处理过的（%E6%BC...），需要先解码再判断汉字
  const decodedText = decodeURIComponent(text);

  if (!/[\u4e00-\u9fa5]/.test(decodedText)) return text;

  return pinyin(decodedText, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive",
  })
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, "")) // 进一步清理非字母数字字符
    .filter(Boolean)
    .join("-");
}

// fumadocs-mdx@11.x returns `files` as a lazy function,
// but fumadocs-core@15.8.x buildContentStorage calls files.map() directly.
// Eagerly resolve the files array to maintain compatibility.
const _fumaSource = docs.toFumadocsSource();
if (typeof _fumaSource.files === "function") {
  (_fumaSource as { files: unknown }).files = (
    _fumaSource.files as () => unknown[]
  )();
}

export const source = loader({
  baseUrl: "/docs",
  source: _fumaSource,
  transformers: [
    ({ storage }) => {
      for (const path of storage.getFiles()) {
        const file = storage.read(path);
        if (
          file &&
          file.format === "page" &&
          path.startsWith("CommunityShare/Leetcode/")
        ) {
          const defaultSlugs = getSlugs(path);
          const newSlugs = defaultSlugs.map(convertSlugToPinyin);

          // 强制覆盖 Fumadocs-MDX 预生成的 slugs
          file.slugs = newSlugs;
        }
      }
    },
  ],
});
