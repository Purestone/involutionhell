"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// 对应后端 UserView DTO 的 TypeScript 类型
// 字段与 involutionhell-backend/.../dto/UserView.java 保持一致
export interface UserView {
  id: number;
  username: string; // 系统用户名，GitHub 登录格式为 github_<uuid>
  displayName: string; // 展示名，来自 GitHub 昵称
  enabled: boolean;
  roles: string[];
  permissions: string[];
  avatarUrl: string | null; // GitHub 头像 URL
  email: string | null; // GitHub 邮箱
  githubId: number | null; // GitHub 数字用户 ID
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: UserView | null;
  status: AuthStatus;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "loading",
  logout: async () => {},
});

// 从 localStorage 读取 satoken
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("satoken");
}

// 调用后端 /auth/me 验证 token 并获取用户信息
// 走 Next.js rewrite（/auth/* → 后端），浏览器无跨域问题
async function fetchCurrentUser(token: string): Promise<UserView | null> {
  try {
    const res = await fetch("/auth/me", {
      headers: { satoken: token },
    });
    if (!res.ok) return null;
    // 后端返回 ApiResponse<UserView>，实际用户数据在 .data 字段
    const body = await res.json();
    return (body.data as UserView) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserView | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    // 1. 检查 URL fragment 中是否携带 #token=xxx（后端 OAuth 登录成功后跳回来时携带）
    // 使用 fragment 而非 query param：fragment 不会出现在服务器日志和 Referer 头中
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const urlToken = hashParams.get("token");

    if (urlToken) {
      // 存入 localStorage
      localStorage.setItem("satoken", urlToken);
      // 用 replaceState 清除 URL 中的 fragment，避免刷新或分享时 token 泄露
      hashParams.delete("token");
      const newHash = hashParams.toString();
      const newUrl =
        window.location.pathname +
        window.location.search +
        (newHash ? "#" + newHash : "");
      window.history.replaceState(null, "", newUrl);
    }

    // 2. 读取存储的 token，调用后端验证并获取用户信息
    const token = urlToken ?? getStoredToken();
    if (!token) {
      // 异步设置，避免在 effect 中同步调用 setState 触发级联渲染
      Promise.resolve().then(() => setStatus("unauthenticated"));
      return;
    }

    fetchCurrentUser(token).then((u) => {
      if (u) {
        setUser(u);
        setStatus("authenticated");
      } else {
        // token 无效或已过期，清除
        localStorage.removeItem("satoken");
        setStatus("unauthenticated");
      }
    });
  }, []);

  // 退出登录：清除 token，调用后端注销接口
  const logout = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        // 走 Next.js rewrite，同源请求
        await fetch("/auth/logout", {
          method: "POST",
          headers: { satoken: token },
        });
      } catch {
        // 即使后端调用失败，也清除本地 token
      }
      localStorage.removeItem("satoken");
    }
    setUser(null);
    setStatus("unauthenticated");
  };

  return (
    <AuthContext.Provider value={{ user, status, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 在任何客户端组件中调用，获取当前登录状态
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
