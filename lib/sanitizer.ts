// 允许显式的控制字符范围，以便上传/路径能可靠地去除它们。
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

/**
 * 用于用户上传资源键（图片、附件等）的严格清理函数。
 * 仅保留 ASCII 字符并保留扩展名，同时去除路径遍历尝试。
 */
export function sanitizeResourceKey(input: string, fallbackBase = "file") {
  const trimmedInput = (input ?? "").trim();
  const safeFallbackBase =
    fallbackBase
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-") || "file";
  const fallbackName = `${safeFallbackBase}-${Date.now()}`;

  if (!trimmedInput) return fallbackName;

  const lastSegment =
    trimmedInput.split(/[\\/]/).filter(Boolean).pop() ?? trimmedInput;
  const lower = lastSegment.toLowerCase();

  // 防止超长字符串导致的 ReDoS 攻击
  if (lower.length > 256) {
    return fallbackName;
  }

  const lastDotIndex = lower.lastIndexOf(".");
  const basePart = lastDotIndex > 0 ? lower.slice(0, lastDotIndex) : lower;
  const rawExtPart = lastDotIndex > 0 ? lower.slice(lastDotIndex) : "";

  const cleanedBase = basePart
    .replace(CONTROL_CHARS, "")
    .replace(/[^a-z0-9._-]+/g, "-") // 立即将非白名单字符合并替换为单个连字符
    .replace(/\.{2,}/g, ".") // 合并多个点
    .replace(/-+/g, "-") // 合并多个连字符
    .replace(/^[._-]+|[-_.]+$/g, ""); // 去除首尾的分隔符

  const cleanedExt = rawExtPart
    .replace(CONTROL_CHARS, "")
    .replace(/[^a-z0-9.]+/g, "")
    .replace(/\.{2,}/g, ".");

  const finalBase = cleanedBase || fallbackName;
  let finalExt = "";
  if (cleanedExt) {
    finalExt = cleanedExt.startsWith(".") ? cleanedExt : `.${cleanedExt}`;
  }

  return `${finalBase}${finalExt}`;
}

/**
 * 用于文档 slug/路径的宽松清理函数。
 * 保留 Unicode 字母/数字，扁平化遍历标记，并规范化分隔符。
 */
export function sanitizeDocumentSlug(input: string, fallback = "untitled") {
  const trimmedInput = (input ?? "").trim();
  if (!trimmedInput) return fallback;

  const lowered = trimmedInput.toLowerCase();

  const cleaned = lowered
    .replace(CONTROL_CHARS, "")
    .replace(/(\.\.?[/\\])+/g, "-")
    .replace(/[\\/]+/g, "-")
    .replace(/[:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");

  const normalized = cleaned
    .replace(/[^-\p{L}\p{N}_]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  return normalized || fallback;
}
