import { SignInButton } from "@/app/components/SignInButton";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string | string[];
    callbackUrl?: string | string[];
  }>;
};

const FALLBACK_CALLBACK_URL = "/";

const coerceSearchParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const resolveRedirectTarget = (
  params: Awaited<LoginPageProps["searchParams"]>,
): string => {
  const redirectTo =
    coerceSearchParam(params?.redirectTo) ??
    coerceSearchParam(params?.callbackUrl);
  return redirectTo || FALLBACK_CALLBACK_URL;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTarget = resolveRedirectTarget(params);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">登录</h1>
          <p className="text-muted-foreground">请登录以访问受保护的页面</p>
        </div>
        <div className="flex justify-center">
          <SignInButton redirectTo={redirectTarget} />
        </div>
      </div>
    </div>
  );
}
