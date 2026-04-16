/**
 * 基于 Upstash Redis 的分布式 rate limiter，专门给 AI 相关 API 用。
 *
 * 背景：免费模型 GLM-4.6V-Flash 并发上限很低（≈ 5），单个用户开几个 tab
 * 就能打爆。必须 per-IP 滑动窗口限流，阻止一个访客拖垮整个站点。
 *
 * 环境变量缺失时自动降级为"不限流 + 打 warn"：允许本地 dev 零配置启动，
 * 但生产必须配齐 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN。
 *
 * 使用：
 *   const { success, reset } = await limitChat(req);
 *   if (!success) return rateLimitResponse(reset);
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 单例 Redis/Ratelimit 实例，避免每次请求都重建连接
let cachedChatLimiter: Ratelimit | null = null;
let cachedChatImageLimiter: Ratelimit | null = null;
let cachedDailyLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** 纯文本聊天：10 req / 60s / IP */
function getChatLimiter(): Ratelimit | null {
  if (cachedChatLimiter) return cachedChatLimiter;
  const redis = getRedis();
  if (!redis) return null;
  cachedChatLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "ratelimit:chat:text",
  });
  return cachedChatLimiter;
}

/** 带图聊天：5 req / 60s / IP（图片更贵，收严） */
function getChatImageLimiter(): Ratelimit | null {
  if (cachedChatImageLimiter) return cachedChatImageLimiter;
  const redis = getRedis();
  if (!redis) return null;
  cachedChatImageLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "ratelimit:chat:image",
  });
  return cachedChatImageLimiter;
}

/** 日限：100 req / 24h / IP，防长尾刷量 */
function getDailyLimiter(): Ratelimit | null {
  if (cachedDailyLimiter) return cachedDailyLimiter;
  const redis = getRedis();
  if (!redis) return null;
  cachedDailyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "24 h"),
    analytics: true,
    prefix: "ratelimit:chat:daily",
  });
  return cachedDailyLimiter;
}

/**
 * 从 request headers 里提取客户端 IP。
 * Vercel 上优先 x-forwarded-for；本地开发回退到 x-real-ip 或 "anonymous"。
 */
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "anonymous";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms timestamp when the window resets */
  reset: number;
  /** 当 Upstash 未配置时，此字段为 true，调用方应跳过限流 */
  skipped?: boolean;
}

/**
 * 对聊天请求做两层限流：per-minute + per-day，任一维度不过就算失败。
 * @param req  Next.js Request
 * @param hasImage  消息是否携带图片（影响每分钟窗口严格度）
 */
export async function limitChat(
  req: Request,
  hasImage = false,
): Promise<RateLimitResult> {
  const minuteLimiter = hasImage ? getChatImageLimiter() : getChatLimiter();
  const dayLimiter = getDailyLimiter();

  // Upstash 未配置：本地开发或生产漏配。不阻塞请求，但打 warn 提示运维。
  if (!minuteLimiter || !dayLimiter) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 未配置，" +
          "生产环境聊天接口无限流保护，请尽快在 Vercel Env 中补齐。",
      );
    }
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
      skipped: true,
    };
  }

  const ip = getClientIp(req);
  const [minuteRes, dayRes] = await Promise.all([
    minuteLimiter.limit(ip),
    dayLimiter.limit(ip),
  ]);

  if (!minuteRes.success) {
    return {
      success: false,
      limit: minuteRes.limit,
      remaining: minuteRes.remaining,
      reset: minuteRes.reset,
    };
  }
  if (!dayRes.success) {
    return {
      success: false,
      limit: dayRes.limit,
      remaining: dayRes.remaining,
      reset: dayRes.reset,
    };
  }
  // 取剩余额度较紧的一档回给调用方
  const tighter = minuteRes.remaining <= dayRes.remaining ? minuteRes : dayRes;
  return {
    success: true,
    limit: tighter.limit,
    remaining: tighter.remaining,
    reset: tighter.reset,
  };
}

/** 生成 429 响应，带标准 Retry-After 和 X-RateLimit-* 头 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000),
  );
  return new Response(
    JSON.stringify({
      error: "请求太频繁了，喘口气再来。",
      code: "rate_limited",
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}
