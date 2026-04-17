"use client";

/**
 * 前端管理员页的权限包装器。
 *
 * 做的事：
 * - 未登录：跳 /login
 * - 登录但不是 admin：渲染 403 提示
 * - 是 admin：渲染 children
 *
 * 注意这个只是 UX 层的保护——真正的安全由后端 @SaCheckRole("admin") 兜底。
 * 用户只要能绕过这里也拿不到数据，后端直接返回 401/403。
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import type { ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/admin/events");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="pt-32 pb-16 min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          Loading…
        </p>
      </main>
    );
  }

  if (status === "unauthenticated") return null;

  const isAdmin = user?.roles?.includes("admin") ?? false;
  if (!isAdmin) {
    return (
      <main className="pt-32 pb-16 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg border border-[#CC0000] p-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#CC0000] mb-3">
            403 · Forbidden
          </div>
          <h1 className="font-serif text-2xl font-black mb-3">你不是管理员</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            管理员界面仅对 <code>roles</code> 包含 <code>admin</code>{" "}
            的账号开放。 如果你认为这是误报，联系站点维护者。
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
