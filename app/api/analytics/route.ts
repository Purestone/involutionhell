import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const { eventType, eventData } = await req.json();

    if (!eventType) {
      return Response.json(
        { error: "Event type is required" },
        { status: 400 },
      );
    }

    // 服务端验证身份，不信任客户端传入的 userId
    const userId = await resolveUserId(req);

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData: eventData ?? {},
        // userId 对应 user_accounts.id（BigInt）；匿名访问为 null
        ...(userId != null && { userId }),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json({ error: "Failed to log event" }, { status: 500 });
  }
}
