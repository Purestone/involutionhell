"use client";

import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
}

export function SignInButton({ className }: SignInButtonProps) {
  // 直接跳转到后端 GitHub OAuth 授权入口（NEXT_PUBLIC_BACKEND_URL）
  // 后端完成授权后带着 token 重定向回前端首页 /#token=xxx（fragment，不会出现在服务器日志中）
  const handleSignIn = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
    window.location.href = `${backendUrl}/oauth/render/github`;
  };

  return (
    <Button
      className={className}
      onClick={handleSignIn}
      size="sm"
      variant="outline"
      data-umami-event="auth_click"
      data-umami-event-action="signin"
      data-umami-event-location="header"
    >
      SignIn
    </Button>
  );
}
