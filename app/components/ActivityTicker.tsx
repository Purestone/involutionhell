import { activityEventsConfig } from "@/app/types/event";
import { cn } from "@/lib/utils";

const { events: rawEvents, settings } = activityEventsConfig;

const {
  maxItems: configuredMaxItems = 3,
  rotationIntervalMs: configuredRotationIntervalMs = 8000,
} = settings;

// 默认配置，从data/event.json中读取配置
const MAX_ITEMS = configuredMaxItems;

/** ActivityTicker 外部传入的样式配置 */
type ActivityTickerProps = {
  /** 容器额外类名，用于控制宽度与定位 */
  className?: string;
};

/**
 * 首页活动轮播组件：
 * - 读取 event.json 配置的活动数量
 * - 横向跑马灯自动滚动，悬停暂停
 * - 每条活动可点击跳转到 Discord
 */
export function ActivityTicker({ className }: ActivityTickerProps) {
  const events = rawEvents.slice(0, MAX_ITEMS);
  const animationDurationMs =
    configuredRotationIntervalMs * Math.max(events.length, 1);

  if (events.length === 0) {
    return null;
  }

  const renderEvent = (
    event: (typeof events)[number],
    keyPrefix: string,
    idx: number,
  ) => (
    <div
      key={`${keyPrefix}-${event.name}-${idx}`}
      className="flex items-center gap-4 whitespace-nowrap"
    >
      <span className="bg-[#CC0000] text-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-tighter shrink-0">
        Update
      </span>
      <a
        href={event.discord}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-xs font-bold uppercase tracking-widest hover:text-[#CC0000]"
      >
        {event.name} —{" "}
        {event.deprecated ? "Archives Available" : "Event Active"}
      </a>
      <span className="text-neutral-400 font-mono text-[10px]">&bull;</span>
      <span className="font-mono text-[10px] text-neutral-500 uppercase">
        Edition 1.0.0
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        "ticker flex items-center w-full h-8 overflow-hidden",
        className,
      )}
    >
      <div
        className="ticker-track items-center"
        style={{ animationDuration: `${animationDurationMs}ms` }}
      >
        <div className="flex items-center gap-6 pr-6 shrink-0">
          {events.map((event, idx) => renderEvent(event, "primary", idx))}
        </div>
        <div
          className="flex items-center gap-6 pr-6 shrink-0"
          aria-hidden="true"
        >
          {events.map((event, idx) => renderEvent(event, "secondary", idx))}
        </div>
      </div>
    </div>
  );
}
