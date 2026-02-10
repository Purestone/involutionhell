"use client";

import { useEffect } from "react";

interface UmamiIdentityProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  } | null;
}

export function UmamiIdentity({ user }: UmamiIdentityProps) {
  useEffect(() => {
    if (user && window.umami && window.umami.identify) {
      // 识别用户，发送用户基础信息
      // Umami v2 支持通过 session data 关联用户信息
      window.umami.identify({
        email: user.email,
        name: user.name,
        id: user.id, // 如果有 ID
      });
    }
  }, [user]);

  return null;
}
