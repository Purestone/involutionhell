import { cn } from "@/lib/utils";
import { fetchHomepageEvents, type HomepageEvent } from "@/lib/events-fetch";

/**
 * 首页顶部活动轮播。
 *
 * 数据源已经从 data/event.json 迁移到后端 /api/events（管理员在 /admin/events 维护）。
 * BACKEND_URL 不可用 / 后端抖动时自动 fallback 到 event.json，保证首屏不会空白。
 *
 * 为什么是 Server Component：
 * - 没有交互状态（纯 CSS 跑马灯动画）
 * - SSR 时已经能拿到数据，避免 client fetch 造成首屏闪烁
 * - revalidate: 300 让 Neon 压力稳定在每 5min 一次 SSR
 *
 * MAX_ITEMS 和 ROTATION_MS 原先在 event.json 的 settings 字段，迁后端后没对应列，
 * 直接在这里作为常量；如果真需要动态，再开一张 events_settings 表。
 */

const MAX_ITEMS = 3;
const ROTATION_MS = 8000;

type ActivityTickerProps = {
  className?: string;
};

export async function ActivityTicker({ className }: ActivityTickerProps) {
  const all = await fetchHomepageEvents();
  const events = all.slice(0, MAX_ITEMS);

  if (events.length === 0) return null;

  const animationDurationMs = ROTATION_MS * Math.max(events.length, 1);
  const lastEventIndex = events.length - 1;

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
          {events.map((event, idx) => (
            <TickerItem
              key={`primary-${event.name}-${idx}`}
              event={event}
              isLast={idx === lastEventIndex}
            />
          ))}
        </div>
        <div
          className="flex items-center gap-6 pr-6 shrink-0"
          aria-hidden="true"
        >
          {events.map((event, idx) => (
            <TickerItem
              key={`secondary-${event.name}-${idx}`}
              event={event}
              isLast={idx === lastEventIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerItem({
  event,
  isLast,
}: {
  event: HomepageEvent;
  isLast: boolean;
}) {
  // 优先跳详情页（有 id 时），否则老行为：直接 Discord / playback
  const href =
    event.id != null
      ? `/events/${event.id}`
      : event.deprecated
        ? event.playback ||
          "https://involutionhell.com/docs/jobs/event-keynote/event-takeway"
        : event.discord;

  const isInternal = href.startsWith("/");

  return (
    <div className="flex items-center gap-4 whitespace-nowrap">
      {isLast ? (
        <span className="bg-[#CC0000] text-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-tighter shrink-0">
          Update
        </span>
      ) : null}
      <a
        href={href}
        target={isInternal ? undefined : "_blank"}
        rel={isInternal ? undefined : "noopener noreferrer"}
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
}
