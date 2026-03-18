import { describe, expect, it } from "vitest";
import eventsJson from "@/data/event.json";
import { ActivityEventsConfigSchema } from "@/app/types/event";

describe("activity events config", () => {
  it("matches the Zod schema", () => {
    const parsed = ActivityEventsConfigSchema.parse(eventsJson);

    expect(parsed.events.length).toBeGreaterThan(0);
  });
});
