/**
 * Sentry Edge runtime 初始化（middleware 及未来可能出现的 Edge routes）。
 * 当前仓库根目录的 middleware.ts 即在此 runtime 执行（IP geo → locale cookie）。
 * 启用条件：production 构建 + DSN 已配置，避免 DSN 漏配时 SDK 启动时打告警。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production" && !!dsn,
  tracesSampleRate: 0.1,
  debug: false,
});
