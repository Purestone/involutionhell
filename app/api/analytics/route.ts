import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { eventType, eventData, userId } = await req.json();

    if (!eventType) {
      return Response.json(
        { error: "Event type is required" },
        { status: 400 },
      );
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData: eventData ?? {},
        userId: userId ? parseInt(String(userId)) : null,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json({ error: "Failed to log event" }, { status: 500 });
  }
}
