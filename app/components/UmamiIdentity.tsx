"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function UmamiIdentity() {
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    if (user && window.umami && window.umami.identify) {
      // 识别用户，发送用户基础信息
      // Umami v2 支持通过 session data 关联用户信息
      window.umami.identify({
        email: user.email,
        name: user.name,
        id: user.id || undefined, // 如果有 ID
      });
    }
  }, [user]);

  return null;
}
