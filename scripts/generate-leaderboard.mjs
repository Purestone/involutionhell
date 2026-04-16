#!/usr/bin/env node
/**
 * @description 从数据库的 doc_contributors 聚合全站贡献者数据，
 * 生成静态的 leaderboard 供排行榜页和首页使用。
 *
 * 用法：
 *   node scripts/generate-leaderboard.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

/**
 * 从仓库 git log 反推 GitHub id → login 映射，优先走 noreply 邮箱（GitHub 默认启用 privacy）。
 * 格式：
 *   1234567+alice@users.noreply.github.com   → id=1234567, login=alice
 *   alice@users.noreply.github.com           → login=alice（老格式，没 id，只能 name 回填）
 *
 * 这样 build 时不用调 100 次 GitHub API 就能拿到绝大多数贡献者的 login，
 * 只有用真实邮箱提交的（少数）才回退到 GitHub API。
 */
function buildLoginMapFromGitLog() {
  const byId = {}; // github_id → login
  const byLogin = {}; // login → login（用于老格式邮箱的兜底，至少保住 name 字段）
  try {
    // --all 覆盖所有 ref；--no-merges 去掉 merge commit 噪音；%ae 邮箱；%an 展示名
    const out = execSync("git log --all --no-merges --format='%ae%x09%an'", {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    for (const line of out.split("\n")) {
      if (!line) continue;
      const [email, name] = line.split("\t");
      if (!email) continue;
      // 先匹配带 id 的 noreply： "1234567+alice@users.noreply.github.com"
      const newStyle = email.match(
        /^(\d+)\+([^@\s]+)@users\.noreply\.github\.com$/,
      );
      if (newStyle) {
        byId[newStyle[1]] = newStyle[2];
        byLogin[newStyle[2]] = newStyle[2];
        continue;
      }
      // 老式 noreply： "alice@users.noreply.github.com"（没 id，只能靠 login 反查）
      const oldStyle = email.match(/^([^@\s]+)@users\.noreply\.github\.com$/);
      if (oldStyle) {
        byLogin[oldStyle[1]] = oldStyle[1];
      }
    }
  } catch (e) {
    console.warn(
      "[generate-leaderboard] git log 解析 login 失败（是否不在仓库内？），退回到纯 GitHub API 模式：",
      e instanceof Error ? e.message : e,
    );
  }
  return { byId, byLogin };
}

// 兼容 Prisma client 引入方式
import * as PrismaModule from "../generated/prisma/client.ts";
const PrismaClient =
  PrismaModule.default?.PrismaClient || PrismaModule.PrismaClient;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
// 我们使用 node:fs/promises 的 fs 即可

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT =
  process.env.LEADERBOARD_OUTPUT || "generated/site-leaderboard.json";

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const outputAbs = path.resolve(REPO_ROOT, OUTPUT);

  if (!process.env.DATABASE_URL) {
    console.error(
      "[generate-leaderboard] 未找到 DATABASE_URL，跳过生成排行榜。正在为您生成空榜单以放行构建... | No DATABASE_URL found. Skipping. Generating an empty leaderboard for build pass...",
    );
    await ensureParentDir(outputAbs);
    try {
      // 检查是否已经存在，存在则不覆盖（或者为了容错直接写入空的 array 也行）
      await fs.writeFile(outputAbs, "[]", "utf-8");
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  }

  const rawData = await fs.readFile(
    path.join(__dirname, "../.source/index.ts"),
    "utf-8",
  );
  const docsMap = {};

  // 正则提取所有类似 { info: {"path":"...","absolutePath":"..."}, data: docs_0 } 的节点数据。
  // 在 .source/index.ts 文件底部有一行类似于：
  // export const docs = _runtime.docs<typeof _source.docs>([{ info: ... }, { info: ... }])
  //
  // 正则解析：

  // - `/s`: 允许 `.` 匹配换行符，防备代码被格式化成多行

  // - `export const docs.*=\s*.*?docs>\(\[`: 匹配由 Fumadocs 自动生成的固定代码开头，直到方括号 `[`
  const pagesInfoMatch = rawData.match(
    /export const docs.*=\s*.*?docs>\(\[(.*?)\]\)/s,
  );

  // pagesInfoMatch[1] 代表我们在上方的正则中用括号 (.*?) 提取出来的具体内容（也就是那一大串 {info: ...} 数组字符串）
  if (pagesInfoMatch && pagesInfoMatch[1]) {
    const pagesRaw = pagesInfoMatch[1];
    // 我们利用简单解析获取所有的 path 和大致提取对应的导入行
    const pageItems = pagesRaw.split("}, {");
    for (const item of pageItems) {
      // - `(.*?)`: 捕获方括号内部的所有的对象内容（非贪婪匹配），这一部分就是所有文章的配置数组
      const pathMatch = item.match(/"path":"(.*?)"/);
      if (pathMatch && pathMatch[1]) {
        const docPath = pathMatch[1];
        let title = docPath.replace(/\.mdx?$/, "");
        // 对于 Fumadocs 以及 Next.js 路由，以 index.md/mdx 结尾的文件实际上对应着目录的根路径
        // 所以我们把拼接出的 `/docs/xxx/index` 最后的 `/index` 去掉
        const url = `/docs/${title}`.replace(/\/index$/, "") || "/docs";

        let docIdFromFm = null;
        // 为了获取确切的 title 和 docId，我们需要打开实际的文件获取 frontmatter，
        try {
          const absolutePathMatch = item.match(/"absolutePath":"(.*?)"/);
          if (absolutePathMatch && absolutePathMatch[1]) {
            const content = await fs.readFile(absolutePathMatch[1], "utf-8");

            // 提取 title
            const titleMatch =
              content.match(/^title:\s*(?:'|")?(.*?)(?:'|")?$/m) ||
              content.match(/^#\s+(.*)$/m);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim();
            }

            // 提取 docId
            const docIdMatch = content.match(
              /^docId:\s*(?:'|")?(.*?)(?:'|")?$/m,
            );
            if (docIdMatch && docIdMatch[1]) {
              docIdFromFm = docIdMatch[1].trim();
            }
          }
        } catch (e) {
          console.error(e);
        }

        // 优先使用 frontmatter 中的 docId 作为键（与数据库中存储的 CUID 对应）
        // 否则回退使用文件路径作为键
        const key = docIdFromFm || docPath.replace(/\.mdx?$/, "");
        docsMap[key] = { title, url };
      }
    }
  }

  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(
    "[generate-leaderboard] 连接数据库以聚合贡献数据... | Connecting to database to aggregate contributions...",
  );

  try {
    // 聚合每一个 github_id 的总贡献量和所有贡献的文章
    const allRecords = await prisma.doc_contributors.findMany();

    const grouped = {};
    for (const record of allRecords) {
      const gid = record.github_id.toString();
      if (!grouped[gid]) {
        grouped[gid] = {
          contributions: 0,
          docs: new Set(),
          // 按日分桶的贡献次数，用于前端渲染活跃度热力图（GitHub 风格 365 格）
          dailyCounts: {},
        };
      }
      grouped[gid].contributions += record.contributions;
      grouped[gid].docs.add(record.doc_id);
      // last_contributed_at 是 timestamptz，只要精度到日即可
      const day = record.last_contributed_at
        ? new Date(record.last_contributed_at).toISOString().slice(0, 10)
        : null;
      if (day) {
        grouped[gid].dailyCounts[day] =
          (grouped[gid].dailyCounts[day] || 0) + record.contributions;
      }
    }

    // 格式化输出榜单
    const leaderboard = Object.entries(grouped)
      .filter(([id, data]) => data.contributions > 0)
      .map(([id, data]) => {
        const points = data.contributions * 10; // 每个 commit 暂定 10 分
        const githubId = id;

        const contributedDocsInfo = Array.from(data.docs).map((dbDocId) => {
          // dbDocId 对应数据库里的 CUID (如 psc0xf6oa1m7g8s9wfwiojkf)
          // 或之前的路径 (如 path/to/doc.mdx 需要去除后缀匹配)
          const key = dbDocId.replace(/\.mdx?$/, "");
          const mappedInfo = docsMap[key];

          return {
            id: dbDocId,
            title: mappedInfo ? mappedInfo.title : dbDocId, // 若没有匹配到页面，回退显示 docId
            url: mappedInfo ? mappedInfo.url : `/docs/${key}`,
          };
        });

        return {
          id: githubId,
          // 暂时没有办法直接从表中获取 login_name，我们就以此格式保留并前端展示默认占位符或者使用 github username API 换取 (如果需要完全离线，则只展示ID)
          name: `GitHub User ${githubId}`,
          points: points,
          commits: data.contributions,
          avatarUrl: `https://avatars.githubusercontent.com/u/${githubId}`,
          contributedDocs: contributedDocsInfo,
          dailyCounts: data.dailyCounts,
        };
      })
      .sort((a, b) => b.points - a.points);

    // Step 1: 先从本地 git log 的 noreply 邮箱反推 id→login，覆盖绝大多数贡献者。
    // 这个是纯本地操作，不打 GitHub API，快且免额度。
    const { byId: loginByGitId } = buildLoginMapFromGitLog();
    let offlineHits = 0;
    for (const user of leaderboard) {
      const login = loginByGitId[user.id];
      if (login) {
        user.name = login;
        offlineHits++;
      }
    }
    console.log(
      `[generate-leaderboard] git log 离线匹配 login：${offlineHits}/${leaderboard.length} 条直接拿到，节省同等数量的 GitHub API 调用`,
    );

    // Step 2: 仍然是 "GitHub User <id>" 占位符的前 100 名才打 GitHub API 兜底
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_PAT || "";
    const topUsers = leaderboard
      .slice(0, 100)
      .filter((u) => u.name === `GitHub User ${u.id}`);

    if (topUsers.length === 0) {
      console.log(
        "[generate-leaderboard] 前 100 名 login 全部命中本地缓存，跳过 GitHub API",
      );
    } else {
      if (!ghToken) {
        console.warn(
          `[generate-leaderboard] 还有 ${topUsers.length} 名用户需要走 GitHub API，但未检测到 GITHUB_TOKEN/GH_PAT，限流 60/hour`,
        );
      } else {
        console.log(
          `[generate-leaderboard] 剩余 ${topUsers.length} 名用户走 GitHub API 兜底 login`,
        );
      }
      let successCount = 0;
      let failureCount = 0;
      for (const user of topUsers) {
        try {
          const headers = {
            "User-Agent": "involutionhell-leaderboard-script",
            Accept: "application/vnd.github+json",
          };
          if (ghToken) headers.Authorization = `Bearer ${ghToken}`;
          const ghRes = await fetch(`https://api.github.com/user/${user.id}`, {
            headers,
          });
          if (ghRes.ok) {
            const data = await ghRes.json();
            user.name = data.login || data.name || user.name;
            successCount++;
          } else {
            failureCount++;
            if (failureCount === 1) {
              console.warn(
                `[generate-leaderboard] GitHub API 返回 ${ghRes.status}，后续失败将静默计数。示例响应：`,
                await ghRes.text().then((t) => t.slice(0, 200)),
              );
            }
          }
        } catch (err) {
          failureCount++;
          if (failureCount === 1) {
            console.warn(
              "[generate-leaderboard] GitHub API 请求异常，后续失败将静默计数。示例错误：",
              err instanceof Error ? err.message : err,
            );
          }
        }
      }
      console.log(
        `[generate-leaderboard] GitHub API 兜底完成：成功 ${successCount} / 失败 ${failureCount}`,
      );
    }

    await ensureParentDir(outputAbs);

    await fs.writeFile(outputAbs, JSON.stringify(leaderboard, null, 2), "utf8");

    console.log(
      `[generate-leaderboard] 排行榜数据已成功写入至 ${OUTPUT} | Successfully wrote leaderboard to ${OUTPUT}`,
    );
  } catch (error) {
    console.error(
      "[generate-leaderboard] 生成排行榜失败： | Failed to generate leaderboard:",
      error,
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
