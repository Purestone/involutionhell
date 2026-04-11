import { SignInButton } from "@/app/components/SignInButton";

export default async function LoginPage() {
  // GitHub OAuth 登录后固定跳回首页（后端回调带 token），登录后各页面自行处理跳转
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">登录</h1>
          <p className="text-muted-foreground">请登录以访问受保护的页面</p>
        </div>
        <div className="flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}
