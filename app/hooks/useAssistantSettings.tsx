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

// --- Encryption helpers using Web Crypto API, with a placeholder key ---
// In a real app, get the passphrase from the user. Here, use a placeholder.
const ENCRYPTION_KEY_PASSPHRASE = "replace-this-passphrase"; // TODO: Prompt user!
const ENCRYPTION_SALT = "assistant-settings-salt"; // static salt (insecure, for demo)

async function getKeyFromPassphrase(passphrase: string) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// encrypt text, return base64(iv):base64(ciphertext)
export async function encryptString(plainText: string, passphrase: string): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassphrase(passphrase);
  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );
  // Pack IV and ciphertext into a base64 string
  return (
    btoa(String.fromCharCode(...iv)) +
    ":" +
    btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  );
}

// decrypt base64(iv):base64(ciphertext)
export async function decryptString(cipherText: string, passphrase: string): Promise<string> {
  if (!cipherText.includes(":")) return "";
  const [ivPart, cipherPart] = cipherText.split(":");
  const iv = Uint8Array.from(atob(ivPart), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(cipherPart), c => c.charCodeAt(0));
  const key = await getKeyFromPassphrase(passphrase);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

// Returns a settings object with encrypted keys, for storage.
export async function encryptSettings(settings: AssistantSettingsState, passphrase: string): Promise<Omit<AssistantSettingsState, "openaiApiKey" | "geminiApiKey"> & { openaiApiKey: string, geminiApiKey: string }> {
  return {
    provider: settings.provider,
    openaiApiKey: settings.openaiApiKey ? await encryptString(settings.openaiApiKey, passphrase) : "",
    geminiApiKey: settings.geminiApiKey ? await encryptString(settings.geminiApiKey, passphrase) : "",
  };
}

// Returns a settings object with decrypted keys, for in-memory use.
export async function decryptSettings(stored: AssistantSettingsState, passphrase: string): Promise<AssistantSettingsState> {
  return {
    provider: stored.provider,
    openaiApiKey: stored.openaiApiKey
      ? await decryptString(stored.openaiApiKey, passphrase)
      : "",
    geminiApiKey: stored.geminiApiKey
      ? await decryptString(stored.geminiApiKey, passphrase)
      : "",
  };
}

type Provider = "openai" | "gemini" | "intern";

interface AssistantSettingsState {
  provider: Provider;
  openaiApiKey: string;
  geminiApiKey: string;
}

interface AssistantSettingsContextValue extends AssistantSettingsState {
  setProvider: (provider: Provider) => void;
  setOpenaiApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  refreshFromStorage: () => void;
}

const SETTINGS_KEY = "assistant-settings-storage";

const defaultSettings: AssistantSettingsState = {
  provider: "openai",
  openaiApiKey: "",
  geminiApiKey: "",
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
    return {
      provider:
        parsed.provider === "gemini"
          ? "gemini"
          : parsed.provider === "intern"
            ? "intern"
            : "openai",
      openaiApiKey:
        typeof parsed.openaiApiKey === "string" ? parsed.openaiApiKey : "",
      geminiApiKey:
        typeof parsed.geminiApiKey === "string" ? parsed.geminiApiKey : "",
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
  // Need to initialize state async due to decryption; use blank, then load in useEffect.
  const [settings, setSettings] = useState<AssistantSettingsState>({ ...defaultSettings });

  // Encrypt and store the settings whenever they change
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    (async () => {
      try {
        // Only store encrypted API keys in localStorage
        const encrypted = await encryptSettings(settings, ENCRYPTION_KEY_PASSPHRASE);
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(encrypted));
      } catch (error) {
        console.error("Failed to save assistant settings to localStorage", error);
      }
    })();
  }, [settings]);

  // On mount, load encrypted settings from localStorage and decrypt
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    (async () => {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      const parsed = parseStoredSettings(raw);
      const decrypted = await decryptSettings(parsed, ENCRYPTION_KEY_PASSPHRASE);
      setSettings(decrypted);
    })();
  }, []);

  // Storage event for cross-tab sync. Decrypt new values!
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SETTINGS_KEY) {
        return;
      }
      (async () => {
        const parsed = parseStoredSettings(event.newValue);
        const decrypted = await decryptSettings(parsed, ENCRYPTION_KEY_PASSPHRASE);
        setSettings(decrypted);
      })();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Refresh from storage (decrypt)
  const refreshFromStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    (async () => {
      const latest = readStoredSettings();
      const decrypted = await decryptSettings(latest, ENCRYPTION_KEY_PASSPHRASE);
      setSettings(decrypted);
    })();
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
