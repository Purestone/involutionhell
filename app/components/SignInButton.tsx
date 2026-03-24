"use client";

import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
}

export function SignInButton({ className }: SignInButtonProps) {
  // 跳转到后端 GitHub OAuth 入口，后端完成授权后会带着 token 重定向回前端首页
  const handleSignIn = () => {
    window.location.href = "/api/v1/oauth/render/github";
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
