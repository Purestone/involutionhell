"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
  redirectTo?: string;
  /**
   * @deprecated Use `redirectTo` (NextAuth v5). Kept for backward compatibility.
   */
  callbackUrl?: string;
}

export function SignInButton({ className, redirectTo }: SignInButtonProps) {
  const targetUrl = redirectTo ?? "/";

  return (
    <Button
      className={className}
      onClick={() => signIn("github", { redirectTo: targetUrl })}
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
