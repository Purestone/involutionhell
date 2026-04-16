import { prisma } from "@/lib/db";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { getModel, requiresApiKey, type AIProvider } from "@/lib/ai/models";
import { buildSystemMessage } from "@/lib/ai/prompt";
import { source } from "@/lib/source";
import { limitChat, rateLimitResponse } from "@/lib/rate-limit";
import fs from "fs/promises";
import path from "path";

// 缓存解析后的 MDX 文本，减少重复的磁盘 I/O 和正则解析开销
const mdxContentCache = new Map<string, string>();

// 流式响应最长30秒
export const maxDuration = 30;

interface ChatRequest {
  messages: UIMessage[];
  system?: string;
  pageContext?: {
    title?: string;
    description?: string;
    content?: string;
    slug?: string;
  };
  provider?: AIProvider;
  apiKey?: string;
  chatId?: string;
}

import { resolveUserId } from "@/lib/server-auth";

export async function POST(req: Request) {
  // 0. Rate limit：免费模型 GLM-4.6V-Flash 并发极低（≈ 5），
  //    单用户开几个 tab 就能打爆。per-IP 滑动窗口限流先挡一层。
  //    （L2 防护；如果 Upstash env 漏配会自动降级为放行+warn）
  const rl = await limitChat(req, false);
  if (!rl.success) return rateLimitResponse(rl);

  // 1. 克隆请求，因为如果代理失败，后面的代码还需要读取 req.json()
  const proxyReq = req.clone();

  // ====== 尝试优雅降级代理到 Java 后端 ======
  // Java 后端 /openai/responses/stream 带 @SaCheckLogin，匿名请求必 401；
  // 直接跳过代理省掉 5s 超时，也避免 401 文案被上游误显示为"unauthorized"。
  // 匿名分支走显式 if 短路，不进 try/catch —— 否则每个匿名请求都会被 catch
  // 打成 "Java Backend unavailable" 带 stack 的 warn，生产日志会刷爆
  // （Copilot CR #1）。
  const satoken = req.headers.get("x-satoken");
  if (!satoken) {
    console.log(
      "[Chat Fallback Proxy] ⏭️  Anonymous request, skip backend proxy, use local inference.",
    );
  } else {
    try {
      const backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) throw new Error("BACKEND_URL is not configured.");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

      // 原封不动把前端的参数丢给 Java
      let proxyRes: Response;
      try {
        proxyRes = await fetch(`${backendUrl}/openai/responses/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 浏览器侧用 x-satoken 传递 token，转发给后端时改回后端期望的 satoken
            satoken,
          },
          body: await proxyReq.text(),
          signal: controller.signal,
        });
      } finally {
        // 无论成功还是抛出（网络错误/超时中断），都清除定时器
        clearTimeout(timeoutId);
      }

      // 如果 Java 后端返回成功，则直接把它的流传回浏览器，提前结束
      if (proxyRes.ok && proxyRes.body) {
        console.log(
          "[Chat Fallback Proxy] 🚀 Java Backend responded successfully. Piping stream...",
        );
        return new Response(proxyRes.body, {
          headers: {
            "Content-Type":
              proxyRes.headers.get("Content-Type") ||
              "text/plain; charset=utf-8",
          },
        });
      } else {
        console.warn(
          `[Chat Fallback Proxy] ⚠️ Java Backend returned status: ${proxyRes.status}, fallback to local Next.js inference.`,
        );
      }
    } catch (error) {
      console.warn(
        `[Chat Fallback Proxy] ❌ Java Backend unavailable or timed out, fallback to local Next.js inference. Error:`,
        error,
      );
    }
  }
  // ====== 代理失败/匿名短路，继续往下走，启用备选方案（本地直连 AI）======

  try {
    // 先把 body 消费掉，再并行验证用户身份
    const {
      messages,
      system,
      pageContext,
      provider = "intern", // 默认使用书生模型
      apiKey,
      chatId,
    }: ChatRequest = await req.json();

    // 并行解析用户身份（不阻塞主流程，失败静默降级为匿名）
    const userIdPromise = resolveUserId(req);

    // 对指定Provider验证key是否存在
    if (requiresApiKey(provider) && (!apiKey || apiKey.trim() === "")) {
      return Response.json(
        {
          error:
            "API key is required. Please configure your API key in the settings.",
        },
        { status: 400 },
      );
    }

    // 如果有 slug 但没有 content，尝试在服务端读取内容
    if (pageContext?.slug && !pageContext.content) {
      try {
        const slugArray = pageContext.slug.split("/");
        const page = source.getPage(slugArray);

        if (page) {
          const cachedContent = mdxContentCache.get(page.path);

          // 在生产环境下使用缓存，开发环境下不使用以支持文档热更新
          if (cachedContent) {
            console.log("[Cache hit!!!!]", page.path);
            pageContext.content = cachedContent;
          } else {
            const fullFilePath = path.join(
              process.cwd(),
              "app/docs",
              page.path,
            );
            const rawContent = await fs.readFile(fullFilePath, "utf-8");
            const content = extractTextFromMDX(rawContent);

            mdxContentCache.set(page.path, content);
            pageContext.content = content;
          }
        }
      } catch (error) {
        console.warn(
          "Failed to fetch content for slug:",
          pageContext.slug,
          error,
        );
        // 出错时不中断，只是缺少上下文
      }
    }

    // 构建系统消息，包含页面上下文
    const systemMessage = buildSystemMessage(system, pageContext);

    // 根据Provider获取 AI 模型实例
    const model = getModel(provider, apiKey);

    const effectiveChatId = chatId || crypto.randomUUID();

    // 生成流式响应
    const result = streamText({
      model: model,
      system: systemMessage,
      messages: await convertToModelMessages(messages || []),
      onFinish: async ({ text }) => {
        try {
          // 等待用户身份解析（与流式传输并行运行，此时大概率已完成）
          const userId = await userIdPromise;

          // 1. 保存/更新会话，绑定用户 ID
          // update 也写入 userId：覆盖此前匿名创建的记录（用户登录后继续同一 chatId）
          await prisma.chat.upsert({
            where: { id: effectiveChatId },
            update: {
              updatedAt: new Date(),
              ...(userId != null && { userId }),
            },
            create: {
              id: effectiveChatId,
              ...(userId != null && { userId }),
            },
          });

          // 2. 保存用户消息 (取最后一条)
          // AI SDK v5 中，UIMessage 不再有 content 字段，内容在 parts 数组中
          const safeMessages = messages || [];
          const lastUserMessage = safeMessages[safeMessages.length - 1];
          if (lastUserMessage && lastUserMessage.role === "user") {
            // 从 parts 数组中提取所有文本内容并拼接
            const userContent = Array.isArray(lastUserMessage.parts)
              ? lastUserMessage.parts
                  .filter((part) => part.type === "text")
                  .map((part) => (part as { type: "text"; text: string }).text)
                  .join("\n")
              : (lastUserMessage as unknown as { content?: string })?.content ||
                "";

            await prisma.message.create({
              data: {
                chatId: effectiveChatId,
                role: "user",
                content: userContent,
              },
            });
          }

          // 3. 保存 AI 回复
          await prisma.message.create({
            data: {
              chatId: effectiveChatId,
              role: "assistant",
              content: text,
            },
          });
        } catch (error) {
          console.error("Failed to save chat history:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    // 处理特定模型创建错误
    if (error instanceof Error && error.message.includes("API key")) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // 识别上游（智谱 GLM）限流/欠费/鉴权错误，给出结构化 code 让前端友好提示。
    // 智谱业务码参考：
    //   1302 - 接口请求并发超额（与 HTTP 429 对应）
    //   1113 - 账户余额不足 / 免费额度耗尽
    //   1001/1002/1003 - 鉴权失败
    const mapped = mapUpstreamError(error);
    if (mapped) {
      return Response.json(
        { error: mapped.message, code: mapped.code },
        { status: mapped.status },
      );
    }

    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}

interface MappedUpstreamError {
  status: number;
  code: "rate_limited" | "quota_exhausted" | "upstream_auth" | "upstream_down";
  message: string;
}

function mapUpstreamError(err: unknown): MappedUpstreamError | null {
  if (!err) return null;
  const raw =
    err instanceof Error
      ? `${err.message} ${(err as Error & { stack?: string }).stack ?? ""}`
      : typeof err === "string"
        ? err
        : JSON.stringify(err);

  // GLM/OpenAI-compatible 的错误通常把 HTTP status 和业务码都塞在 message 里
  const hasStatus429 = /\b429\b|rate[-_ ]?limit|too many requests/i.test(raw);
  const has1302 = /\b1302\b|并发超额|速率限制|控制请求频率/.test(raw);
  const has1113 = /\b1113\b|余额不足|额度.*耗尽|quota.*exhaust/i.test(raw);
  const hasAuth =
    /\b1001\b|\b1002\b|\b1003\b|\b401\b|unauthorized|invalid.*api.*key/i.test(
      raw,
    );

  if (has1302 || hasStatus429) {
    return {
      status: 429,
      code: "rate_limited",
      message: "AI 服务被挤爆了，排队中，请 30 秒后再试。(上游并发限流)",
    };
  }
  if (has1113) {
    return {
      status: 503,
      code: "quota_exhausted",
      message:
        "免费模型今日额度已用完，请明天再来，或在设置里切到你自己的 OpenAI/Gemini。",
    };
  }
  if (hasAuth) {
    return {
      status: 502,
      code: "upstream_auth",
      message:
        "AI 服务密钥配置异常，站点管理员已收到通知。请稍后重试或切换到自有 API Key。",
    };
  }
  return null;
}

// 提取纯文本内容，过滤掉 MDX 语法
function extractTextFromMDX(content: string): string {
  let text = content
    .replace(/^---[\s\S]*?---/m, "") // 移除头部元数据 (frontmatter)
    .replace(/```[\s\S]*?```/g, "") // 移除代码块
    .replace(/`([^`]+)`/g, "$1"); // 移除内联代码符号，保留内容

  // 递归移除 HTML/MDX 标签，防止嵌套标签清理不干净
  let prevText;
  do {
    prevText = text;
    text = text.replace(/<[^>]+>/g, "");
  } while (text !== prevText);

  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 移除粗体符号，保留文字
    .replace(/\*([^*]+)\*/g, "$1") // 移除斜体符号，保留文字
    .replace(/#{1,6}\s+/g, "") // 移除标题符号 (#)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 移除链接语法，仅保留链接文本
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // 移除图片语法，保留 alt 文本
    .replace(/[#*`()[!\]!]/g, "") // 移除剩余的常用 Markdown 符号
    .replace(/\n{2,}/g, "\n") // 规范化换行，将多余的空行合并
    .trim();
}
