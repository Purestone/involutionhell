/**
 * Sentry Edge runtime 初始化（Middleware / Edge routes）。
 * 当前项目未使用 edge runtime，保留配置以便未来迁移时无需补齐。
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  debug: false,
});
