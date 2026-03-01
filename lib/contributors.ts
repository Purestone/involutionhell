import dataset from "@/generated/doc-contributors.json";

export interface ContributorEntry {
  githubId: string;
  contributions: number;
  lastContributedAt: string | null;
  login?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
}

export interface DocContributorsRecord {
  docId: string;
  path: string | null;
  contributorStats: Record<string, number>;
  contributors: ContributorEntry[];
}

export interface ContributorsDataset {
  repo: string;
  generatedAt: string;
  docsDir: string;
  totalDocs: number;
  results: DocContributorsRecord[];
}

const contributorsDataset = dataset as unknown as ContributorsDataset;

// 预先构建 Map 缓存，将查找的时间复杂度从 O(N) 降低到 O(1)
const contributorsByPath = new Map<string, DocContributorsRecord>();
const contributorsByDocId = new Map<string, DocContributorsRecord>();

for (const result of contributorsDataset.results) {
  if (result.path) {
    contributorsByPath.set(result.path, result);
  }
  if (result.docId) {
    contributorsByDocId.set(result.docId, result);
  }
}

function normalizeRelativePath(relativePath: string): string {
  const cleaned = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
  return `app/docs/${cleaned}`;
}

export function getContributorsDataset(): ContributorsDataset {
  return contributorsDataset;
}

export function getDocContributorsByPath(
  relativeDocPath: string,
): DocContributorsRecord | null {
  if (!relativeDocPath) return null;
  const normalized = normalizeRelativePath(relativeDocPath);
  return contributorsByPath.get(normalized) ?? null;
}

export function getDocContributorsByDocId(
  docId: string | undefined | null,
): DocContributorsRecord | null {
  if (!docId) return null;
  return contributorsByDocId.get(docId) ?? null;
}

export function listDocContributors(): DocContributorsRecord[] {
  return contributorsDataset.results;
}
