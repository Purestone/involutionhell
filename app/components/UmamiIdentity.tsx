"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";

export function UmamiIdentity() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && window.umami && window.umami.identify) {
      // 识别用户，发送用户基础信息给 Umami Analytics
      window.umami.identify({
        id: String(user.id),
        name: user.displayName,
        username: user.username,
      });
    }
  }, [user]);

  return null;
}
