/**
 * Next.js 15+ 约定的启动 hook：每个 runtime 启动时各自拉对应 Sentry 配置，
 * 避免在 edge runtime 错误加载 Node-only 代码。
 *
 * onRequestError 暴露给 Next.js 捕获服务端组件/路由层面的未捕获错误。
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
