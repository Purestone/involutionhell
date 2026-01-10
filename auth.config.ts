import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// 在本地开发环境允许没有 .env 的协作者运行站点，因此先尝试读取两个常见的密钥变量，缺失时再使用内置的开发兜底值。
const envSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

// 开发环境允许兜底，生产环境必须显式配置
const secret =
  envSecret ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "__involutionhell_dev_secret__");

if (!envSecret && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] AUTH_SECRET missing – using development fallback secret",
  );
}

if (process.env.NODE_ENV === "production" && !envSecret) {
  throw new Error("[auth] AUTH_SECRET (or NEXTAUTH_SECRET) must be set in production");
}

export const authConfig = {
  providers: [],
  secret,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnEditor = nextUrl.pathname.startsWith("/editor");

      // 保护 /dashboard 和 /editor 路由
      // if (isOnDashboard || isOnEditor) {
      if (isOnDashboard || isOnEditor) {
        if (isLoggedIn) return true;
        return false; // 未登录用户会被重定向到 /login
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // 允许相对路径的回调 URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // 允许与 baseUrl 同源的回调 URL
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn() {
      return true;
    },
    async session({ session, token }) {
      // 将登录使用的 provider 挂到 session 上，方便前端组件根据登录方式展示提示或操作（例如切换 GitHub 账号）。
      const extendedSession = session as typeof session & { provider?: string };
      const extendedToken = token as
        | (typeof token & { provider?: string })
        | undefined;
      if (extendedToken?.provider) {
        extendedSession.provider = extendedToken.provider;
      }
      return extendedSession;
    },
    async jwt({ token, account }) {
      // 在用户完成 OAuth 回调时记录 provider；后续 session 回调会把它带给客户端。
      const extendedToken = token as typeof token & { provider?: string };
      if (account?.provider) {
        extendedToken.provider = account.provider;
      }
      return extendedToken;
    },
  },

} satisfies NextAuthConfig;
