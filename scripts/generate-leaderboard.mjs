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
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

// 兼容 Prisma client 引入方式
import * as PrismaModule from "../generated/prisma/client.ts";
const PrismaClient =
  PrismaModule.default?.PrismaClient || PrismaModule.PrismaClient;
import pg from "pg";
const { Pool } = pg;
import { PrismaPg } from "@prisma/adapter-pg";

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
  if (!process.env.DATABASE_URL) {
    console.error("[generate-leaderboard] No DATABASE_URL found. Skipping.");
    process.exit(0);
  }

  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(
    "[generate-leaderboard] Connecting to database to aggregate contributions...",
  );

  try {
    // 聚合每一个 github_id 的总贡献量
    const aggregations = await prisma.doc_contributors.groupBy({
      by: ["github_id"],
      _sum: {
        contributions: true,
      },
    });

    // 格式化输出榜单
    const leaderboard = aggregations
      .filter((item) => item._sum.contributions && item._sum.contributions > 0)
      .map((item) => {
        const points = Number(item._sum.contributions) * 10; // 每个 commit 暂定 10 分
        const githubId = item.github_id.toString();

        return {
          id: githubId,
          // 暂时没有办法直接从表中获取 login_name，我们就以此格式保留并前端展示默认占位符或者使用 github username API 换取 (如果需要完全离线，则只展示ID)
          name: `GitHub User ${githubId}`,
          points: points,
          commits: item._sum.contributions,
          avatarUrl: `https://avatars.githubusercontent.com/u/${githubId}`,
        };
      })
      .sort((a, b) => b.points - a.points);

    // 为前排用户附带一下 Github API 拉取详细昵称信息，由于只是少数人（例如前100），可以接受构建时拉取。
    console.log(
      `[generate-leaderboard] Aggregated ${leaderboard.length} users. Annotating top 100 with Github API...`,
    );

    // 我们在此取前 100 名抓取 Github Name 防止 Rate Limit
    const topUsers = leaderboard.slice(0, 100);
    for (let user of topUsers) {
      try {
        const ghRes = await fetch(`https://api.github.com/user/${user.id}`, {
          headers: {
            "User-Agent": "involutionhell-leaderboard-script",
          },
        });
        if (ghRes.ok) {
          const data = await ghRes.json();
          user.name = data.login || data.name || user.name;
        }
      } catch (err) {
        // Ignore fetch errors
      }
    }

    const outputAbs = path.resolve(REPO_ROOT, OUTPUT);
    await ensureParentDir(outputAbs);

    await fs.writeFile(outputAbs, JSON.stringify(leaderboard, null, 2), "utf8");

    console.log(
      `[generate-leaderboard] Successfully wrote leaderboard to ${OUTPUT}`,
    );
  } catch (error) {
    console.error(
      "[generate-leaderboard] Failed to generate leaderboard:",
      error,
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
