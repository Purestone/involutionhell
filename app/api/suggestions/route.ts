import { generateText } from "ai";
import { getModel, requiresApiKey, type AIProvider } from "@/lib/ai/models";

// 允许流式响应最长30秒
export const maxDuration = 30;

interface SuggestionsRequest {
  messages: any[];
  pageContext?: {
    title?: string;
    description?: string;
    slug?: string;
  };
  provider?: AIProvider;
  apiKey?: string;
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      pageContext,
      provider = "intern",
      apiKey,
    }: SuggestionsRequest = await req.json();

    // 如果需要，验证 API 密钥
    if (requiresApiKey(provider) && (!apiKey || apiKey.trim() === "")) {
      return Response.json(
        { error: "需要 API 密钥 (API key is required)" },
        { status: 400 },
      );
    }

    // 获取模型实例
    const model = getModel(provider, apiKey);

    // 当前页面上下文
    const contextInfo = pageContext
      ? `当前页面上下文 (Current Page Context):
Title: ${pageContext.title || "未知"}
Description: ${pageContext.description || "无"}
Slug: ${pageContext.slug || "无"}`
      : "";

    // 生成建议
    // 使用 generateText 而不是 generateObject，以获得更好的兼容性（即使模型不支持工具调用）
    const prompt = `
      你是一个乐于助人的文档助手。
      基于以下对话历史和当前页面上下文，建议 3 个用户可能会问的简短的后续问题。
      问题应该简洁（最多 10-15 个字），并帮助用户进一步探索文档。

      重要：请检测用户最后一条消息的语言。如果用户使用英文，请生成英文建议；如果用户使用中文，请生成中文建议。保持与用户当前语言一致。
      
      ${contextInfo}
      
      对话历史 (Conversation History):
      ${JSON.stringify(messages.slice(-4))} // 仅使用最后几条消息作为上下文
      
      请直接返回一个 JSON 数组，包含 3 个字符串问题，不要包含任何 Markdown 格式或其他文本。
      例如：["如何安装？", "怎么配置 API？", "查看示例代码"]
    `;

    const { text } = await generateText({
      model,
      prompt,
    });

    let questions: string[] = [];
    try {
      // 尝试解析 JSON
      // 清理可能存在的 Markdown 代码块标记 inside the text
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      questions = JSON.parse(cleanedText);
    } catch (e) {
      console.error("解析建议 JSON 失败:", e, "原始文本:", text);
      // 如果解析失败，尝试按行分割兜底
      questions = text
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 3);
    }

    // 确保返回的是数组且不超过3个
    if (!Array.isArray(questions)) {
      questions = [];
    }

    return Response.json({ questions: questions.slice(0, 3) });
  } catch (error) {
    console.error("建议 API 错误 (Suggestions API error):", error);
    return Response.json(
      { error: "无法生成建议 (Failed to generate suggestions)" },
      { status: 500 },
    );
  }
}
