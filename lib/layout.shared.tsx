import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { AuthNav } from "@/app/components/AuthNav";
import { LocaleToggle } from "@/app/components/LocaleToggle";
import { SidebarThemeToggle } from "@/app/components/SidebarThemeToggle";

export async function baseOptions(): Promise<BaseLayoutProps> {
  return {
    nav: {
      title: "内卷地狱",
      children: (
        // 只放登录入口；语言切换挪到 sidebar 底部与主题按钮同排，见下方 themeSwitch
        <div className="ms-auto flex items-center gap-2 pr-3">
          <AuthNav />
        </div>
      ),
    },
    // Fumadocs sidebar 底部的主题切换槽。
    // 内置按钮走 next-themes，但根 layout 里传的是 theme={{ enabled: false }}
    // （避免和自建 ThemeProvider 同时写 <html class> 导致闪烁），内置按钮于是点不动。
    // 这里替换为自己的 LocaleToggle + ThemeToggle，挂在自建 ThemeProvider 上。
    themeSwitch: {
      component: (
        <div className="ms-auto flex items-center gap-1">
          <LocaleToggle />
          <SidebarThemeToggle />
        </div>
      ),
    },
  };
}
