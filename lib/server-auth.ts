/**
 * 服务端身份验证工具函数（仅用于 Next.js API Route / Server Component）
 *
 * 从入参请求的 x-satoken 头读取 token，以 satoken 头转发给后端 /auth/me 验证身份，
 * 返回 user_accounts.id（BigInt），匿名或 token 无效时返回 null。
 *
 * 使用方：app/api/chat/route.ts、app/api/analytics/route.ts
 */
export async function resolveUserId(req: Request): Promise<bigint | null> {
  const token = req.headers.get("x-satoken");
  if (!token || !process.env.BACKEND_URL) return null;
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: { satoken: token },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const id = body?.data?.id;
    return id != null ? BigInt(id) : null;
  } catch {
    return null;
  }
}
