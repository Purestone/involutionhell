"use client";

import { useSession } from "next-auth/react";
import { SignInButton } from "@/app/components/SignInButton";
import { UserMenu } from "@/app/components/UserMenu";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="size-9 rounded-full bg-muted animate-pulse" />;
  }

  const user = session?.user;
  const provider =
    session && "provider" in session
      ? (session.provider as string | undefined)
      : undefined;

  return user ? <UserMenu user={user} provider={provider} /> : <SignInButton />;
}
