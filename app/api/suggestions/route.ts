import { generateText } from "ai";
import { getModel, requiresApiKey, type AIProvider } from "@/lib/ai/models";
import { createGlmFlashModel } from "@/lib/ai/providers/glm";

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

    // 模型选择策略：
    // - 若用户选了自己的 Provider（openai/gemini），用用户的模型
    // - 否则（默认 intern）优先用 GLM-4-Flash（免费且快速），若 ZHIPU_API_KEY 未配置则回退到 intern
    let model;
    if (provider !== "intern") {
      // 用户自选模型（openai / gemini）
      model = getModel(provider, apiKey);
    } else if (process.env.ZHIPU_API_KEY) {
      // 默认使用智谱 GLM-4-Flash（免费轻量）
      model = createGlmFlashModel();
    } else {
      // 兜底：仍使用 intern
      model = getModel("intern");
    }

    // 只取最后一条用户消息，减少 token 消耗
    const lastUserMsg = messages
      .filter((m: any) => m.role === "user")
      .slice(-1)[0];
    const lastText =
      lastUserMsg?.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ") ??
      lastUserMsg?.content ??
      "";

    // 语言检测：简单判断是否包含中文字符
    const isChinese = /[\u4e00-\u9fa5]/.test(lastText);

    const prompt = isChinese
      ? `用户问："${lastText}"。给出3个简短中文追问（每个不超过15字），直接返回JSON数组，例如：["问题1","问题2","问题3"]`
      : `User asked: "${lastText}". Suggest 3 short follow-up questions (max 10 words each). Return a JSON array only, e.g. ["Q1","Q2","Q3"]`;

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
