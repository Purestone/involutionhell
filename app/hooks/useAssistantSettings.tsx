"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";

type Provider = "openai" | "gemini" | "deepseek";

interface AssistantSettingsState {
  provider: Provider;
  openaiApiKey: string;
  geminiApiKey: string;
  saveToLocalStorage: boolean; // 是否将API Key保存到localStorage
}

interface AssistantSettingsContextValue extends AssistantSettingsState {
  setProvider: (provider: Provider) => void;
  setOpenaiApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  setSaveToLocalStorage: (save: boolean) => void;
  refreshFromStorage: () => void;
}

const SETTINGS_KEY = "assistant-settings-storage";

const defaultSettings: AssistantSettingsState = {
  provider: "deepseek",
  openaiApiKey: "",
  geminiApiKey: "",
  saveToLocalStorage: false,
};

const AssistantSettingsContext = createContext<
  AssistantSettingsContextValue | undefined
>(undefined);

const parseStoredSettings = (raw: string | null): AssistantSettingsState => {
  if (!raw) {
    return { ...defaultSettings };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AssistantSettingsState>;
    const saveToLocalStorage = parsed.saveToLocalStorage === true;

    let provider =
      parsed.provider === "gemini"
        ? "gemini"
        : parsed.provider === "deepseek"
          ? "deepseek"
          : "openai";

    const openaiApiKey =
      saveToLocalStorage && typeof parsed.openaiApiKey === "string"
        ? parsed.openaiApiKey
        : "";
    const geminiApiKey =
      saveToLocalStorage && typeof parsed.geminiApiKey === "string"
        ? parsed.geminiApiKey
        : "";

    // 如果用户之前默认在 openai/gemini 但现在没有对应的 API Key，则回退到免配置的 intern 模型
    if (provider === "openai" && !openaiApiKey) {
      provider = "deepseek";
    }
    if (provider === "gemini" && !geminiApiKey) {
      provider = "deepseek";
    }

    return {
      provider: provider as Provider,
      // Use only stored key if saveToLocalStorage is true
      // 只有在saveToLocalStorage为true时才使用存储的key
      openaiApiKey,
      geminiApiKey,
      saveToLocalStorage,
    };
  } catch (error) {
    console.error(
      "Failed to parse assistant settings from localStorage",
      error,
    );
    return { ...defaultSettings };
  }
};

const readStoredSettings = (): AssistantSettingsState => {
  if (typeof window === "undefined") {
    return { ...defaultSettings };
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  return parseStoredSettings(raw);
};

export const AssistantSettingsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [settings, setSettings] = useState<AssistantSettingsState>(() =>
    readStoredSettings(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Decide whether to save API keys based on saveToLocalStorage
      // 根据saveToLocalStorage决定是否保存API key
      const dataToSave = settings.saveToLocalStorage
        ? settings
        : {
            ...settings,
            openaiApiKey: "",
            geminiApiKey: "",
          };

      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save assistant settings to localStorage", error);
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SETTINGS_KEY) {
        return;
      }

      setSettings(parseStoredSettings(event.newValue));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refreshFromStorage = useCallback(() => {
    setSettings((prev) => {
      const storedSettings = readStoredSettings();

      if (storedSettings.saveToLocalStorage) {
        return storedSettings;
      }

      return {
        ...prev,
        ...storedSettings,
        openaiApiKey: prev.openaiApiKey,
        geminiApiKey: prev.geminiApiKey,
      };
    });
  }, []);

  const value = useMemo(
    (): AssistantSettingsContextValue => ({
      ...settings,
      setProvider: (provider: Provider) => {
        setSettings((prev) => ({ ...prev, provider }));
      },
      setOpenaiApiKey: (key: string) => {
        setSettings((prev) => ({ ...prev, openaiApiKey: key }));
      },
      setGeminiApiKey: (key: string) => {
        setSettings((prev) => ({ ...prev, geminiApiKey: key }));
      },
      setSaveToLocalStorage: (save: boolean) => {
        setSettings((prev) => ({ ...prev, saveToLocalStorage: save }));
      },
      refreshFromStorage,
    }),
    [settings, refreshFromStorage],
  );

  return (
    <AssistantSettingsContext.Provider value={value}>
      {children}
    </AssistantSettingsContext.Provider>
  );
};

export const useAssistantSettings = () => {
  const context = useContext(AssistantSettingsContext);

  if (!context) {
    throw new Error(
      "useAssistantSettings must be used within an AssistantSettingsProvider",
    );
  }

  return context;
};
