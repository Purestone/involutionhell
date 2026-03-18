import { sanitizeDocumentSlug } from "@/lib/sanitizer";

export type DirNode = {
  name: string;
  path: string;
  children?: DirNode[];
};

export const FILENAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_-]+$/u;

export function ensureMarkdownExtension(filename: string) {
  const trimmed = filename.trim();
  if (!trimmed) {
    return "";
  }
  const normalized = trimmed.toLowerCase();
  return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

export function stripMarkdownExtension(filename: string) {
  return filename.trim().toLowerCase().replace(/\.md$/i, "");
}

export function normalizeFilenameBase(filename: string) {
  const trimmed = filename.trim();
  if (!trimmed) return "";
  const withoutExt = stripMarkdownExtension(trimmed);
  return sanitizeDocumentSlug(withoutExt);
}

export function normalizeMarkdownFilename(filename: string) {
  const base = normalizeFilenameBase(filename);
  if (!base) return "";
  return ensureMarkdownExtension(base);
}
