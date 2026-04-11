import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Create Intern-AI model instance
 * Uses environment variable INTERN_KEY for API key
 * 在开发环境下，临时映射到 Deepseek 进行测试
 * @returns Configured Intern-AI model instance
 */
export function createInternModel() {
  const isDev = process.env.NODE_ENV === "development";

  const intern = createOpenAICompatible({
    name: "intern",
    baseURL: isDev
      ? "https://api.deepseek.com" // 开发环境临时使用 Deepseek 接口测试
      : "https://chat.intern-ai.org.cn/api/v1/",
    apiKey: isDev ? process.env.DEEPSEEK_API_KEY : process.env.INTERN_KEY,
  });

  // Use the specific model configured for this project
  return intern(isDev ? "deepseek-chat" : "intern-s1");
}
