// next.config.mjs
import { createMDX } from "fumadocs-mdx/next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * IMPORTANT: remarkImage 配置已移至 source.config.ts 统一管理
 *
 * 原因：
 * 1. 避免配置冲突 - 之前这里的 remarkPlugins 会覆盖 source.config.ts 的配置
 * 2. 统一管理 - 所有 MDX 相关配置（remarkPlugins, rehypePlugins, remarkImageOptions）
 *    都在 source.config.ts 中，便于维护
 *
 * 如需修改图片处理配置，请前往 source.config.ts
 */
const withMDX = createMDX({
  configPath: "source.config.ts",
  // mdxOptions 留空，让 source.config.ts 统一管理所有 remark/rehype 插件
});
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [
      {
        // GitHub OAuth 回调：GitHub → localhost:3000/api/auth/callback/github → 后端
        // 路径与 GitHub OAuth App 注册的 callback URL 保持一致，无需改 GitHub App 设置
        source: "/api/auth/callback/github",
        destination: `${backendUrl}/api/auth/callback/github`,
      },
      {
        // 认证 API（/auth/me, /auth/logout 等）走 Next.js 代理，避免浏览器跨域 CORS 问题
        // 浏览器只见 localhost:3000，Next.js 服务端再转发给 localhost:8080
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/analytics/:path*",
        destination: `${backendUrl}/analytics/:path*`,
      },
      {
        // 用户中心 API（偏好设置等）代理到后端，避免浏览器跨域
        source: "/api/user-center/:path*",
        destination: `${backendUrl}/api/user-center/:path*`,
      },
      {
        // OAuth 跳转入口（/oauth/render/github），走 rewrite 让前端不感知后端端口
        // 后端返回 302 到 GitHub 授权页，Next.js 透传 302 给浏览器完成跳转
        source: "/oauth/:path*",
        destination: `${backendUrl}/oauth/:path*`,
      },
      {
        // 文档 commit 历史代理到 Java（带 Caffeine 10min 缓存 + GITHUB_TOKEN），
        // 原 Next API Route 已删除，避免 Vercel Fluid CPU 被拉取 GitHub API 的请求吃掉
        source: "/api/docs/history",
        destination: `${backendUrl}/api/docs/history`,
      },
      {
        // Events 公开读接口 + 感兴趣接口
        // 需要两条规则：`/:path*` 不匹配空路径（即 /api/events 本身）
        source: "/api/events",
        destination: `${backendUrl}/api/events`,
      },
      {
        source: "/api/events/:path*",
        destination: `${backendUrl}/api/events/:path*`,
      },
      {
        // Events 管理员 CRUD（后端 @SaCheckRole("admin") 做权限校验）
        source: "/api/admin/events",
        destination: `${backendUrl}/api/admin/events`,
      },
      {
        source: "/api/admin/events/:path*",
        destination: `${backendUrl}/api/admin/events/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.github.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.nlark.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.coly.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
    /**
     * CRITICAL: 禁用 Next.js 图片优化
     *
     * 原因：Vercel 的图片优化配额已耗尽
     *
     * 重要说明：
     * - Vercel 免费计划的图片优化有配额限制（每月 1000 次源图片优化）
     * - 我们的网站图片较多，很快会超出配额
     * - 超出配额后会导致图片加载失败或构建失败
     * - 因此必须设置 unoptimized: true 禁用图片优化
     *
     * 影响：
     * - ✅ 图片会以原始格式和尺寸提供（不会被 Vercel 优化）
     * - ✅ 不消耗 Vercel 配额
     * - ⚠️  失去自动格式转换（WebP/AVIF）和尺寸优化
     * - ⚠️  可能有轻微的性能影响（但我们已使用 Cloudflare R2 等 CDN）
     *
     * 如果未来升级到付费计划或迁移到自托管，可以考虑移除此选项
     */
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

const finalConfig = withNextIntl(withMDX(config));

// Sentry 包裹：webpack 插件需要看到最终的 Next 配置才能上传 source map。
// silent: !CI 让本地构建不刷日志，只在 Vercel CI 构建时打印。
// widenClientFileUpload 扩大 source map 扫描范围，保证前端错误堆栈能解出来。
// disableLogger 树摇掉 Sentry 自带 logger，减小 bundle 体积。
//
// 守门条件：只有在存在 SENTRY_AUTH_TOKEN 时才启用 withSentryConfig。
// 贡献者 clone 仓库后没配 Sentry env 也能直接 `pnpm build` / `pnpm dev`，
// 不会因为 webpack 插件缺凭据而构建失败。生产 Vercel 那边 env 齐全，正常上报。
const enableSentry = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default enableSentry
  ? withSentryConfig(finalConfig, {
      org: process.env.SENTRY_ORG || "involutionhell",
      project: process.env.SENTRY_PROJECT || "sentry-bole-notebook",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      // 不启用 tunnelRoute：需要加 /monitoring rewrite，和现有 rewrites 交互
      // 复杂；广告屏蔽对 docs 站影响小，后续真需要再打开。
    })
  : finalConfig;
