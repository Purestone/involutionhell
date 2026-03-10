import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // 数据库适配器：仅在有 DATABASE_URL 时启用
  const adapter = process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined;

  if (!process.env.DATABASE_URL) {
    console.warn("[auth] DATABASE_URL missing – running without Neon adapter");
  }
  return {
    ...authConfig,
    providers: [
      GitHub({
        clientId:
          process.env.NODE_ENV !== "production" &&
          process.env.AUTH_GITHUB_ID_DEV
            ? process.env.AUTH_GITHUB_ID_DEV
            : process.env.AUTH_GITHUB_ID,
        clientSecret:
          process.env.NODE_ENV !== "production" &&
          process.env.AUTH_GITHUB_SECRET_DEV
            ? process.env.AUTH_GITHUB_SECRET_DEV
            : process.env.AUTH_GITHUB_SECRET,
        profile(profile) {
          return {
            id: profile.id.toString(), // 与数据库的整数主键兼容
            name: profile.name ?? profile.login,
            email: profile.email,
            image: profile.avatar_url,
          };
        },
      }),
    ],
    ...(adapter
      ? {
          adapter,
          session: {
            strategy: "database" as const,
          },
        }
      : {
          session: {
            strategy: "jwt" as const,
          },
        }),
  };
});
