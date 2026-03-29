import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Create Deepseek AI model instance
 * Uses environment variable DEEPSEEK_API_KEY for API key
 * @returns Configured Deepseek model instance
 */
export function createDeepseekModel() {
  const deepseek = createOpenAICompatible({
    name: "deepseek",
    baseURL: "https://api.deepseek.com/v1", // Some compatible SDKs expect /v1
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
  });

  return deepseek("deepseek-chat");
}
