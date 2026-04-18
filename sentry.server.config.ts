/**
 * Sentry Node.js runtime 初始化（Next.js API routes / Server Components / RSC）。
 * 与 client 同策略：production 且 DSN 已配置时启用，traces 10%，无 replay/profiling。
 * 加 DSN 校验是为了避免漏配 env 时 SDK 初始化打告警日志（Copilot CR）。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production" && !!dsn,
  tracesSampleRate: 0.1,
  debug: false,
});
