"use client";

/**
 * Fumadocs sidebar 底部用的 ThemeToggle。
 *
 * 视觉复刻 fumadocs-ui 内置 ThemeToggle（圆形 border + sun/moon 居中高亮），
 * 但 onClick 走自己的 ThemeProvider（layout.tsx 里禁用了 fumadocs 的 next-themes，
 * 内置按钮点击无效；这里直接 setTheme 到自建 ThemeProvider 即可）。
 */

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 把 "system" 折算成实际显示主题，决定哪个 icon 高亮
  const resolved = (() => {
    if (!mounted) return null;
    if (theme === "system") {
      return typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme === "dark" ? "dark" : "light";
  })();

  return (
    <button
      type="button"
      aria-label="Toggle Theme"
      data-theme-toggle=""
      className="inline-flex items-center rounded-full border p-1"
      onClick={() => {
        const next = resolved === "light" ? "dark" : "light";
        setTheme(next);
        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("theme_toggle", { theme: next });
        }
      }}
    >
      <Sun
        fill="currentColor"
        className={cn(
          "size-6.5 rounded-full p-1.5",
          resolved === "light"
            ? "bg-fd-accent text-fd-accent-foreground"
            : "text-fd-muted-foreground",
        )}
      />
      <Moon
        fill="currentColor"
        className={cn(
          "size-6.5 rounded-full p-1.5",
          resolved === "dark"
            ? "bg-fd-accent text-fd-accent-foreground"
            : "text-fd-muted-foreground",
        )}
      />
    </button>
  );
}
