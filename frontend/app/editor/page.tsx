import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EditorPageClient } from "./EditorPageClient";

/**
 * 编辑器页面 - Server Component
 * 验证用户登录状态，未登录则重定向到登录页
 */
export default async function EditorPage() {
  const session = await auth();

  // 如果用户未登录，重定向到登录页，并传递 callbackUrl
  if (!session?.user) {
    redirect("/login?callbackUrl=/editor");
  }

  return (
    <div className="min-h-screen bg-background">
      <EditorPageClient session={session} />
    </div>
  );
}
