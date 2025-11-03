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

/* ---------------- Types ---------------- */

type Provider = "openai" | "gemini" | "intern";

interface AssistantSettingsState {
  provider: Provider;
  openaiApiKey: string; // 解密后的明文，内存中持有
  geminiApiKey: string; // 解密后的明文，内存中持有
}

interface AssistantSettingsContextValue extends AssistantSettingsState {
  setProvider: (provider: Provider) => void;
  setOpenaiApiKey: (key: string) => void; // 传入明文，内部负责加密存储
  setGeminiApiKey: (key: string) => void; // 传入明文，内部负责加密存储
  refreshFromStorage: () => void;
  setPassphrase: (passphrase: string | null) => void; // 设置/清空加密口令
  hasPassphrase: boolean;
}

/* ---------------- Constants ---------------- */

const SETTINGS_KEY = "assistant-settings-storage";
const PASSPHRASE_KEY = "assistant-settings-passphrase"; // 仅 sessionStorage
const ENC_PREFIX = "enc:v1:"; // enc:v1:<saltB64>:<ivB64>:<cipherB64>

const defaultSettings: AssistantSettingsState = {
  provider: "openai",
  openaiApiKey: "",
  geminiApiKey: "",
};

/* ---------------- Crypto helpers (browser only) ---------------- */

const enc = new TextEncoder();
const dec = new TextDecoder();

// 保证底层 buffer 是 ArrayBuffer，避免 ArrayBufferLike 带来的 TS 不匹配
type U8 = Uint8Array & { buffer: ArrayBuffer };
const u8 = (len: number): U8 =>
  crypto.getRandomValues(new Uint8Array(new ArrayBuffer(len))) as U8;

// 统一把 ArrayBuffer / ArrayBufferView 转成可遍历的 Uint8Array 视图（无 instanceof Uint8Array）
function viewOf(input: ArrayBuffer | ArrayBufferView): Uint8Array {
  return input instanceof ArrayBuffer
    ? new Uint8Array(input)
    : new Uint8Array(
        input.buffer as ArrayBuffer,
        input.byteOffset,
        input.byteLength,
      );
}

function toB64(input: ArrayBuffer | ArrayBufferView): string {
  const bytes = viewOf(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromB64(b64: string): U8 {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out as U8; // buffer: ArrayBuffer
}

async function getKeyFromPassphrase(passphrase: string, salt: BufferSource) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase.normalize?.("NFKC") ?? passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptIfNeeded(
  plain: string,
  passphrase: string | null,
): Promise<string> {
  if (!passphrase || typeof window === "undefined" || !window.crypto?.subtle) {
    // 无口令或非浏览器环境：明文存储（兼容旧数据）
    console.warn(
      "Cannot encrypt assistant setting: missing passphrase or unsupported environment",
    );
    return plain;
  }
  const salt: BufferSource = u8(16);
  const iv: BufferSource = u8(12);
  const key = await getKeyFromPassphrase(passphrase, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plain),
  );
  return `${ENC_PREFIX}${toB64(salt as ArrayBufferView)}:${toB64(iv as ArrayBufferView)}:${toB64(ct)}`;
}

async function decryptIfNeeded(
  token: string,
  passphrase: string | null,
): Promise<string> {
  try {
    if (!token.startsWith(ENC_PREFIX)) return token; // 明文
    if (
      !passphrase ||
      typeof window === "undefined" ||
      !window.crypto?.subtle
    ) {
      // 有密文但无口令/环境不支持，无法解密：返回空，避免把密文当明文用
      console.error(
        "Cannot decrypt assistant setting: missing passphrase or unsupported environment",
      );
      return "";
    }
    const [, rest] = token.split(ENC_PREFIX);
    const [saltB64, ivB64, ctB64] = rest.split(":");
    if (!saltB64 || !ivB64 || !ctB64) return "";

    const salt: BufferSource = fromB64(saltB64);
    const iv: BufferSource = fromB64(ivB64);
    const ct = fromB64(ctB64);

    const key = await getKeyFromPassphrase(passphrase, salt);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return dec.decode(pt);
  } catch {
    console.error("Failed to decrypt assistant setting with given passphrase");
    return ""; // 口令不匹配或数据损坏
  }
}

/* ---------------- Storage helpers ---------------- */

type StoredShape = {
  provider?: Provider;
  openaiApiKey?: string; // 明文或 enc:v1:...
  geminiApiKey?: string; // 明文或 enc:v1:...
};

const parseStored = (raw: string | null): StoredShape => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredShape;
  } catch {
    return {};
  }
};

const readPassphrase = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(PASSPHRASE_KEY);
  } catch {
    return null;
  }
};

const writePassphrase = (pass: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (!pass) window.sessionStorage.removeItem(PASSPHRASE_KEY);
    else window.sessionStorage.setItem(PASSPHRASE_KEY, pass);
  } catch {
    console.error("Failed to write passphrase to sessionStorage");
  }
};

const readStoredSettings = async (): Promise<AssistantSettingsState> => {
  if (typeof window === "undefined") return { ...defaultSettings };
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  const stored = parseStored(raw);
  const passphrase = readPassphrase();

  const provider: Provider =
    stored.provider === "gemini"
      ? "gemini"
      : stored.provider === "intern"
        ? "intern"
        : "openai";

  const openaiApiKey = await decryptIfNeeded(
    stored.openaiApiKey ?? "",
    passphrase,
  );
  const geminiApiKey = await decryptIfNeeded(
    stored.geminiApiKey ?? "",
    passphrase,
  );

  return { provider, openaiApiKey, geminiApiKey };
};

const writeStoredSettings = async (state: AssistantSettingsState) => {
  if (typeof window === "undefined") return;
  const passphrase = readPassphrase();

  const payload: StoredShape = {
    provider: state.provider,
    openaiApiKey: await encryptIfNeeded(state.openaiApiKey, passphrase),
    geminiApiKey: await encryptIfNeeded(state.geminiApiKey, passphrase),
  };

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save assistant settings to localStorage", error);
  }
};

/* ---------------- Context ---------------- */

const AssistantSettingsContext = createContext<
  AssistantSettingsContextValue | undefined
>(undefined);

export const AssistantSettingsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [settings, setSettings] =
    useState<AssistantSettingsState>(defaultSettings);
  const [hasPassphrase, setHasPassphrase] = useState<boolean>(
    () => !!readPassphrase(),
  );

  // 初次装载：从 storage 读取并（必要时）解密
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await readStoredSettings();
      if (alive) setSettings(s);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 监听跨标签页的 storage 变化
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = async (event: StorageEvent) => {
      if (event.key !== SETTINGS_KEY) return;
      const s = await readStoredSettings();
      setSettings(s);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // settings 变化即写回（必要时加密）
  useEffect(() => {
    (async () => {
      await writeStoredSettings(settings);
    })();
  }, [settings]);

  const refreshFromStorage = useCallback(() => {
    (async () => {
      const s = await readStoredSettings();
      setSettings(s);
    })();
  }, []);

  const setPassphrase = useCallback(
    (pass: string | null) => {
      writePassphrase(pass && pass.length ? pass : null);
      setHasPassphrase(!!(pass && pass.length));
      // 口令变化后立即重写一份（把已有明文转密文或反之）
      (async () => {
        await writeStoredSettings(settings);
        const s = await readStoredSettings();
        setSettings(s);
      })();
    },
    [settings],
  );

  const value = useMemo<AssistantSettingsContextValue>(
    () => ({
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
      setPassphrase,
      hasPassphrase,
    }),
    [settings, refreshFromStorage, setPassphrase, hasPassphrase],
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
