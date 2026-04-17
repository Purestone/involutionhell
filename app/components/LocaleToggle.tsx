"use client";

/**
 * Header 里的语言切换按钮（匿名也能用）。
 *
 * 为什么要做：
 *   之前切语言的唯一入口在 /settings 页面，UserMenu 里只有登录用户能看到。
 *   访客看到的永远是默认 zh，站点对英语用户非常不友好。
 *
 * 实现：
 *   - 写 locale=zh|en 到 document.cookie（path=/，一年有效期，samesite=lax）
 *     字段和格式与 SettingsForm 完全一致，登录用户在设置页改的偏好仍然生效
 *   - 切完 router.refresh() 让 SSR 重新渲染，server component（Hero / docs
 *     详情页等）从 cookie 读新 locale 切文案
 *   - 简单的 ZH / EN 双字母展示，当前语言高亮；button 尺寸与 ThemeToggle 对齐
 */

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Locale = "zh" | "en";

// 自定义事件名：toggle 点击后 dispatch，通知 useSyncExternalStore 重新读取 cookie
const LOCALE_EVENT = "locale-toggle-change";

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "zh";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const v = m?.[1];
  return v === "en" ? "en" : "zh";
}

function writeLocaleCookie(next: Locale) {
  // 一年；samesite=lax 够用（这个 cookie 不涉及跨站 POST）
  document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

// 订阅 LOCALE_EVENT，toggle 时主动 dispatch 让 useSyncExternalStore 重新读 cookie
function subscribeLocale(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LOCALE_EVENT, callback);
  return () => window.removeEventListener(LOCALE_EVENT, callback);
}

const emptySubscribe = () => () => {};

export function LocaleToggle() {
  const router = useRouter();
  // 用 useSyncExternalStore 替代 useEffect+setState：SSR 返回 "zh"，客户端读 cookie
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    () => readLocaleCookie(),
    () => "zh",
  );
  // ready 表示已 hydrate 到客户端，可以按真实 locale 高亮
  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const toggle = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    writeLocaleCookie(next);
    // 通知所有订阅者（当前组件）重新从 cookie 读取
    window.dispatchEvent(new Event(LOCALE_EVENT));
    // 刷新 server component 树，重新按 cookie 渲染各页面
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle language"
      title={locale === "zh" ? "切换为 English" : "Switch to 中文"}
      className="h-10 px-2 rounded-none font-mono text-xs uppercase tracking-widest transition-colors"
      data-umami-event="locale_toggle"
      data-umami-event-locale={locale === "zh" ? "en" : "zh"}
    >
      <span className={ready && locale === "zh" ? "font-bold" : "opacity-50"}>
        ZH
      </span>
      <span className="opacity-30 mx-0.5">/</span>
      <span className={ready && locale === "en" ? "font-bold" : "opacity-50"}>
        EN
      </span>
    </Button>
  );
}
