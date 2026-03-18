import { z } from "zod";
import eventsJson from "@/data/event.json";

export const ActivityEventSchema = z.object({
  /** 活动名称，用于轮播标题 */
  name: z.string().min(1, "name 不能为空"),
  /** Discord 活动入口链接 */
  discord: z.string().min(1, "discord 入口不能为空"),
  /** 活动回放链接，deprecated 为 true 时展示 */
  playback: z.string().optional(),
  /** 活动封面，可以是静态资源相对路径或完整 URL */
  coverUrl: z.string().min(1, "coverUrl 不能为空"),
  /** 是否为已结束活动，true 时展示 Playback 按钮 */
  deprecated: z.boolean(),
});

export const ActivityTickerSettingsSchema = z.object({
  /** 首屏最多展示的活动数量 */
  maxItems: z.number().int().positive("maxItems 需要为正整数"),
  /** 自动轮播的间隔时间（毫秒） */
  rotationIntervalMs: z
    .number()
    .int()
    .positive("rotationIntervalMs 需要为正整数"),
});

export const ActivityEventsConfigSchema = z.object({
  settings: ActivityTickerSettingsSchema,
  events: z.array(ActivityEventSchema),
});

type ActivityEvent = z.infer<typeof ActivityEventSchema>;
type ActivityTickerSettings = z.infer<typeof ActivityTickerSettingsSchema>;
type ActivityEventsConfig = z.infer<typeof ActivityEventsConfigSchema>;

const parsedEventsConfig = ActivityEventsConfigSchema.safeParse(eventsJson);

if (!parsedEventsConfig.success) {
  const issueMessages = parsedEventsConfig.error.issues
    .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`event.json 配置不合法:\n${issueMessages}`);
}

export const activityEventsConfig: ActivityEventsConfig =
  parsedEventsConfig.data;

export type { ActivityEvent, ActivityEventsConfig, ActivityTickerSettings };
