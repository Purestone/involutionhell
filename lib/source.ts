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

console.log(">>> [Source.ts] 正在加载路由重映射插件...");

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  transformers: [
    ({ storage }) => {
      let count = 0;
      for (const path of storage.getFiles()) {
        const file = storage.read(path);
        if (
          file &&
          file.format === "page" &&
          path.startsWith("CommunityShare/Leetcode/")
        ) {
          const defaultSlugs = getSlugs(path);
          const newSlugs = defaultSlugs.map(convertSlugToPinyin);

          if (count < 3) {
            console.log(
              `>>> [Transformer] 映射样例: ${path} -> ${newSlugs.join("/")}`,
            );
          }

          // 强制覆盖 Fumadocs-MDX 预生成的 slugs
          file.slugs = newSlugs;
          count++;
        }
      }
      console.log(
        `>>> [Transformer] 任务完成，共成功重映射 ${count} 条拼音路径。`,
      );
    },
  ],
});
