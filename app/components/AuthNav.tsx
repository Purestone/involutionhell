"use client";

import { useAuth } from "@/lib/use-auth";
import { SignInButton } from "@/app/components/SignInButton";
import { UserMenu } from "@/app/components/UserMenu";

export function AuthNav() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return <div className="size-9 rounded-full bg-muted animate-pulse" />;
  }

  return user ? (
    <UserMenu
      user={{
        name: user.displayName,
        email: user.email ?? null,
        image: user.avatarUrl ?? null,
      }}
      provider="github"
      logout={logout}
    />
  ) : (
    <SignInButton />
  );
}
