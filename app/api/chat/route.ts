import { prisma } from "@/lib/db";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { getModel, requiresApiKey, type AIProvider } from "@/lib/ai/models";
import { buildSystemMessage } from "@/lib/ai/prompt";
import { source } from "@/lib/source";
import fs from "fs/promises";
import path from "path";

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

export async function POST(req: Request) {
  try {
    const {
      messages,
      system,
      pageContext,
      provider = "intern", // 默认使用书生模型
      apiKey,
      chatId,
    }: ChatRequest = await req.json();

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
          const fullFilePath = path.join(process.cwd(), "app/docs", page.path);
          const rawContent = await fs.readFile(fullFilePath, "utf-8");
          pageContext.content = extractTextFromMDX(rawContent);
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

    // 确保有 chatId (如果前端没传，就生成一个临时的，虽然这会导致每次请求都是新会话)
    // 理想情况是前端应该维护 chatId
    const effectiveChatId = chatId || crypto.randomUUID();

    // 生成流式响应
    const result = streamText({
      model: model,
      system: systemMessage,
      messages: convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        try {
          // 1. 保存/更新会话
          await prisma.chat.upsert({
            where: { id: effectiveChatId },
            update: { updatedAt: new Date() },
            create: { id: effectiveChatId },
          });

          // 2. 保存用户消息 (取最后一条)
          // AI SDK v5 中，UIMessage 不再有 content 字段，内容在 parts 数组中
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage && lastUserMessage.role === "user") {
            // 从 parts 数组中提取所有文本内容并拼接
            const userContent = lastUserMessage.parts
              .filter((part) => part.type === "text")
              .map((part) => (part as { type: "text"; text: string }).text)
              .join("\n");

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

    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
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
