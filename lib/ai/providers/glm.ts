import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * 创建智谱 GLM 模型实例
 * 使用 GLM-4-Flash（免费模型），适合轻量任务如建议生成
 * API key 需在环境变量 ZHIPU_API_KEY 中配置
 */
export function createGlmFlashModel() {
  const glm = createOpenAICompatible({
    name: "zhipu",
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
    apiKey: process.env.ZHIPU_API_KEY,
  });

  return glm("glm-4-flash");
}
