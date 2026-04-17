/**
 * 首屏活动数据获取（Server Component 用）。
 *
 * 做的事：
 * 1. 调后端 /api/events 拿 published + archived 列表
 * 2. 转成首页 ActivityTicker / FloatWindow 原本认识的老 schema（name / discord / playback /
 *    coverUrl / deprecated），这样这两个组件内部渲染逻辑不需要大改
 * 3. 后端挂了 / BACKEND_URL 没配 → fallback 到 data/event.json，保证首页不会因为后端抖动白屏
 *
 * 为什么保留 event.json：
 * - 开发环境没启后端时，首页还能跑
 * - 生产 fallback 场景（后端挂了一会儿），首屏轮播不至于完全消失
 * - JSON 是静态构建时就在的，没有运行时开销
 */

import type { EventView } from "@/app/events/types";
import eventsJson from "@/data/event.json";

/** Hero / FloatWindow 老版本识别的字段结构（沿用 ActivityEvent schema） */
export interface HomepageEvent {
  name: string;
  discord: string;
  playback?: string;
  coverUrl: string;
  deprecated: boolean;
  /** 新加字段：后端返回的 id，给 "详情" 链接用。JSON fallback 时为 null */
  id: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 把后端 EventView 映射成 HomepageEvent 老 schema。
 * - discord: 直接用 discordLink；没有时拿活动详情页 URL 兜底
 * - playback: 直接用 playbackUrl
 * - coverUrl: 后端 coverUrl 可能为 null；fallback 到一张默认 placeholder
 * - deprecated: status=archived 或已过 endTime 时为 true
 */
function toHomepageEvent(ev: EventView): HomepageEvent {
  return {
    id: ev.id,
    name: ev.title,
    discord: ev.discordLink ?? `/events/${ev.id}`,
    playback: ev.playbackUrl ?? undefined,
    coverUrl: ev.coverUrl ?? "/event/coffeeChat.webp",
    deprecated:
      ev.past || ev.status === "archived" || ev.status === "cancelled",
  };
}

/** 从 data/event.json fallback（后端不可用时用）。和老组件期待的结构 1:1。 */
function fallbackFromJson(): HomepageEvent[] {
  // event.json 没 id，给 null 占位；order 保持 JSON 里顺序
  interface JsonItem {
    name: string;
    discord: string;
    playback?: string;
    coverUrl: string;
    deprecated: boolean;
  }
  const items = (eventsJson as { events: JsonItem[] }).events;
  return items.map((e) => ({
    id: null,
    name: e.name,
    discord: e.discord,
    playback: e.playback,
    coverUrl: e.coverUrl,
    deprecated: e.deprecated,
  }));
}

/**
 * 拿首页要用的活动列表。
 * - 成功：按"未过期 → 已过期"排序后返回
 * - 失败：fallback 到 JSON
 * 失败原因记日志，不向外抛，避免首页 SSR 500
 */
export async function fetchHomepageEvents(): Promise<HomepageEvent[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.warn(
      "[fetchHomepageEvents] BACKEND_URL 未配置，使用 event.json fallback",
    );
    return fallbackFromJson();
  }

  try {
    const res = await fetch(`${backendUrl}/api/events`, {
      next: { revalidate: 300 },
      headers: {
        accept: "application/json",
        "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
      },
    });
    if (!res.ok) {
      console.warn(
        `[fetchHomepageEvents] 后端 ${res.status} ${res.statusText}，走 JSON fallback`,
      );
      return fallbackFromJson();
    }
    const json = (await res.json()) as ApiResponse<EventView[]>;
    if (!json.success || !json.data || json.data.length === 0) {
      // 后端虽然返回成功但是空数据，还是走 fallback 保持首页有内容
      return fallbackFromJson();
    }
    const items = json.data
      .map(toHomepageEvent)
      // 未过期的活动排前面
      .sort((a, b) => Number(a.deprecated) - Number(b.deprecated));
    return items;
  } catch (err) {
    console.warn("[fetchHomepageEvents] 网络异常走 JSON fallback:", err);
    return fallbackFromJson();
  }
}
