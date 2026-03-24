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

// 后端地址（浏览器直接访问，Next.js public env var）
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// 调用后端 /auth/me 验证 token 并获取用户信息
async function fetchCurrentUser(token: string): Promise<UserView | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
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
    // 1. 检查 URL 中是否携带 ?token=xxx（后端 OAuth 登录成功后跳回来时携带）
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      // 存入 localStorage
      localStorage.setItem("satoken", urlToken);
      // 用 replaceState 清除 URL 中的 token 参数，避免刷新或分享时 token 泄露
      params.delete("token");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? "?" + newSearch : "") +
        window.location.hash;
      window.history.replaceState(null, "", newUrl);
    }

    // 2. 读取存储的 token，调用后端验证并获取用户信息
    const token = urlToken ?? getStoredToken();
    if (!token) {
      setStatus("unauthenticated");
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
        await fetch(`${BACKEND_URL}/auth/logout`, {
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
