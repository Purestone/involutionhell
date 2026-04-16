import "server-only";
import { cookies } from "next/headers";
import { formatMessage, type Locale, type MessageKey } from "./messages";

/**
 * 服务端读 locale cookie。未设置回退 zh（和 docs 页 getLocaleFromCookie 逻辑一致）。
 * middleware.ts 已经在用户首次访问时写入 locale cookie，这里只是消费。
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const val = store.get("locale")?.value;
  return val === "en" ? "en" : "zh";
}

/**
 * 服务端翻译函数。直接在 Server Component 用：
 *   const t = await getServerT();
 *   <h1>{t("profile.stats.docs")}</h1>
 */
export async function getServerT() {
  const locale = await getServerLocale();
  return (key: MessageKey, params?: Record<string, string | number>) =>
    formatMessage(locale, key, params);
}
