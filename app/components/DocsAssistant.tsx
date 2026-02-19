"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AssistantModal } from "@/app/components/assistant-ui/assistant-modal";
import {
  AssistantSettingsProvider,
  useAssistantSettings,
} from "@/app/hooks/useAssistantSettings";

interface PageContext {
  title?: string;
  description?: string;
  slug?: string;
}

interface DocsAssistantProps {
  pageContext: PageContext;
}

export function DocsAssistant({ pageContext }: DocsAssistantProps) {
  return (
    <AssistantSettingsProvider>
      <DocsAssistantInner pageContext={pageContext} />
    </AssistantSettingsProvider>
  );
}

function DocsAssistantInner({ pageContext }: DocsAssistantProps) {
  const { provider, openaiApiKey, geminiApiKey } = useAssistantSettings();

  const apiKey =
    provider === "openai"
      ? openaiApiKey
      : provider === "gemini"
        ? geminiApiKey
        : "";

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          pageContext,
          provider,
          apiKey,
        },
      }),
    [pageContext, provider, apiKey],
  );

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const chat = useChat({
    id: `assistant-${provider}-${apiKey}`, // Force chat reset when provider OR key changes
    // 当 Provider 或 Key 更改时强制重置聊天
    transport,
    onFinish: () => {
      // 聊天流式传输完成后（onFinish），记录一次查询行为
      if (window.umami) {
        window.umami.track("ai_assistant_query");
      }
    },
  });

  const {
    error: chatError,
    status: chatStatus,
    messages,
    clearError: clearChatError,
    // 其他需要的属性...
  } = chat;

  // 跟踪上一次的状态，用于检测对话结束
  const prevStatusRef = useRef(chatStatus);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;

    // 当状态从 'streaming' 变为 'submitted' (或不再是 streaming) 时
    // 注意：具体状态变化取决于 AI SDK 版本，通常 streaming -> dom ready
    // 这里我们假设当 user 没在输入且不在 loading 时，可以获取建议
    // 更准确的是监听 status 变化
    if (
      prevStatus === "streaming" &&
      chatStatus !== "streaming" &&
      chatStatus !== "submitted"
    ) {
      // 聊天结束，获取建议
      setIsLoadingSuggestions(true);

      const currentMessages = messages;

      (async () => {
        try {
          const response = await fetch("/api/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: currentMessages,
              pageContext,
              provider,
              apiKey,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.questions)) {
              setSuggestions(data.questions);
            }
          }
        } catch (error) {
          console.error("获取建议失败:", error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      })();
    }
    prevStatusRef.current = chatStatus;
  }, [chatStatus, messages, pageContext, provider, apiKey]);

  // 当用户发送新消息时清空建议
  useEffect(() => {
    if (chatStatus === "streaming" || chatStatus === "submitted") {
      setSuggestions([]);
    }
  }, [chatStatus]);

  // 当 Provider 更改时清除之前的错误
  useEffect(() => {
    clearChatError();
  }, [provider, clearChatError]);

  // 当对话状态重置时也清除错误
  useEffect(() => {
    if (chatStatus === "submitted" || chatStatus === "streaming") {
      clearChatError();
    }
  }, [chatStatus, clearChatError]);

  const assistantError =
    chatError && chatStatus !== "submitted" && chatStatus !== "streaming"
      ? deriveAssistantError(chatError, provider)
      : null;

  const handleClearError = useCallback(() => {
    clearChatError();
  }, [clearChatError]);

  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal
        errorMessage={assistantError?.message}
        showSettingsAction={assistantError?.showSettingsCTA ?? false}
        onClearError={assistantError ? handleClearError : undefined}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
      />
    </AssistantRuntimeProvider>
  );
}

interface AssistantErrorState {
  message: string;
  showSettingsCTA: boolean;
}

type AssistantProvider = "openai" | "gemini" | "intern";

type AssistantErrorData = {
  error?: string;
};

type AssistantErrorPayload = {
  message?: string;
  statusCode?: number;
  responseBody?: string;
  data?: AssistantErrorData;
};

type AssistantErrorInput =
  | AssistantErrorPayload
  | Error
  | string
  | null
  | undefined;

function deriveAssistantError(
  err: AssistantErrorInput,
  provider: AssistantProvider,
): AssistantErrorState {
  const providerLabel =
    provider === "gemini"
      ? "Google Gemini"
      : provider === "intern"
        ? "Intern-AI"
        : "OpenAI";
  const fallback: AssistantErrorState = {
    message:
      "The assistant couldn't complete that request. Please try again later.",
    showSettingsCTA: false,
  };

  if (!err) {
    return fallback;
  }

  const maybeError = coerceAssistantErrorPayload(err);

  let message = "";

  if (
    typeof maybeError.message === "string" &&
    maybeError.message.trim().length > 0
  ) {
    message = maybeError.message.trim();
  }

  if (
    typeof maybeError.responseBody === "string" &&
    maybeError.responseBody.trim().length > 0
  ) {
    const extracted = extractErrorFromResponseBody(maybeError.responseBody);
    if (extracted) {
      message = extracted;
    }
  }

  if (!message && maybeError.data?.error) {
    message = maybeError.data.error.trim();
  }

  const statusCode =
    typeof maybeError.statusCode === "number"
      ? maybeError.statusCode
      : undefined;
  const normalized = message.toLowerCase();

  let showSettingsCTA = false;

  // For intern provider, don't show settings CTA for API key related errors
  // 对于书生，不要显示 API 密钥相关的错误
  if (
    provider !== "intern" &&
    (statusCode === 400 ||
      statusCode === 401 ||
      statusCode === 403 ||
      normalized.includes("api key") ||
      normalized.includes("apikey") ||
      normalized.includes("missing key") ||
      normalized.includes("unauthorized"))
  ) {
    showSettingsCTA = true;
  }

  let friendlyMessage = message || fallback.message;

  if (showSettingsCTA) {
    friendlyMessage =
      message && message.length > 0
        ? message
        : `The ${providerLabel} API key looks incorrect. Update it in settings and try again.`;
  } else if (statusCode === 429) {
    friendlyMessage =
      "The provider is rate limiting requests. Please wait and try again.";
  } else if (statusCode && statusCode >= 500) {
    friendlyMessage =
      "The AI provider is currently unavailable. Please try again soon.";
  }

  return {
    message: friendlyMessage,
    showSettingsCTA,
  };
}

function coerceAssistantErrorPayload(
  err: AssistantErrorInput,
): AssistantErrorPayload {
  if (!err) {
    return {};
  }
  if (typeof err === "string") {
    return { message: err };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return err;
}

function extractErrorFromResponseBody(body: string): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed) as string | AssistantErrorData;
    if (typeof parsed === "string") {
      return parsed.trim();
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.error === "string"
    ) {
      return parsed.error.trim();
    }
  } catch {
    // Ignore JSON parsing issues and fall back to the raw body text.
    // 忽略 JSON 解析问题，回退到原始正文文本。
  }

  return trimmed;
}
