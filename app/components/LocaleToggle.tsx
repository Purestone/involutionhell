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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Locale = "zh" | "en";

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

export function LocaleToggle() {
  const router = useRouter();
  // 初始 render 先给默认值避免 hydration 不一致，真实值由 useEffect 读 cookie 后覆盖
  const [locale, setLocale] = useState<Locale>("zh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocale(readLocaleCookie());
    setReady(true);
  }, []);

  const toggle = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    writeLocaleCookie(next);
    setLocale(next);
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
