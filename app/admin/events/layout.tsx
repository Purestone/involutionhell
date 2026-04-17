import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

/**
 * Admin 活动后台的共享 layout：
 * 因为 Header / Footer 是 Server Component（用 next-intl 的 getTranslations），
 * 不能直接在 "use client" 的 page.tsx 里渲染（会触发
 * "getTranslations is not supported in Client Components" 500）。
 * 所以把 Header / Footer 提到这个 Server Component layout 里，
 * 让 admin page 自己是纯 client 组件只管渲染内容区。
 */
export default function AdminEventsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
