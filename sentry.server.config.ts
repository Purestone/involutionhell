/**
 * Sentry Node.js runtime 初始化（Next.js API routes / Server Components / RSC）。
 * 与 client 同策略：仅 production 启用，traces 10%，无 replay/profiling。
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  debug: false,
});
