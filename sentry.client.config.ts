/**
 * Sentry 浏览器端初始化。
 *
 * 免费 tier 策略（Developer plan，5K errors/月 + 10K perf units/月）：
 * - 只在 production 启用，避免本地 dev/preview 污染配额
 * - tracesSampleRate 0.1：10% 的页面 transaction 采样足够看性能趋势
 * - 关闭 Session Replay：它是另外的独立配额（小），开了容易炸
 * - 不启用 profiling（需要付费）
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // 线上开 false 省日志；排障时临时改 true
  debug: false,
});
