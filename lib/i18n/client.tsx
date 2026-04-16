"use client";

import { createContext, useContext, useMemo } from "react";
import { formatMessage, type Locale, type MessageKey } from "./messages";

const LocaleContext = createContext<Locale>("zh");

/**
 * 包在根 layout 上，locale 由服务端读 cookie 算好再传下来。
 * 客户端组件用 useT() 拿翻译函数；不用自己读 cookie（那样 SSR/CSR 会不一致）。
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

/**
 * 客户端组件翻译 hook。
 *   const t = useT();
 *   <button>{t("follow.follow")}</button>
 */
export function useT() {
  const locale = useContext(LocaleContext);
  return useMemo(
    () => (key: MessageKey, params?: Record<string, string | number>) =>
      formatMessage(locale, key, params),
    [locale],
  );
}

/** 直接取当前 locale，较少用（大多数时候你要的是 useT） */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}
