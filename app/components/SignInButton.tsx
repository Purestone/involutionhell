import { signIn } from "@/auth";
import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
  redirectTo?: string;
  /**
   * @deprecated Use `redirectTo` (NextAuth v5). Kept for backward compatibility.
   */
  callbackUrl?: string;
}

export function SignInButton({
  className,
  redirectTo,
  callbackUrl,
}: SignInButtonProps) {
  const targetUrl = redirectTo ?? callbackUrl ?? "/";

  return (
    <form
      className={className}
      action={async () => {
        "use server";
        await signIn("github", {
          redirectTo: targetUrl,
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="outline"
        data-umami-event="auth_click"
        data-umami-event-action="signin"
        data-umami-event-location="header"
      >
        SignIn
      </Button>
    </form>
  );
}
