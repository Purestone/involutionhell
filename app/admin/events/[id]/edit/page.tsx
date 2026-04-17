"use client";

/**
 * /admin/events/[id]/edit — 编辑活动。
 *
 * 进来先拉 /api/admin/events/{id} 拿完整数据（含 draft 状态的字段），
 * 然后把数据塞给 <EventForm initial={...}>。
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { EventView } from "@/app/events/types";
import { AdminGuard } from "../../AdminGuard";
import { EventForm } from "../../EventForm";
import { getAdminEvent } from "../../lib";

interface Param {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: Param) {
  // React 19 的 new-style async params：用 use() 同步解包 Promise
  const { id } = use(params);
  // 路由参数不受控，可能是 "abc"、"12ab" 之类非法字符串；直接 Number() 得到 NaN
  // 会让后续请求变成 /api/admin/events/NaN 并报一条迷惑错误（"活动不存在"）。
  // 用 parseInt 严格解析 + Number.isFinite 双重校验，非法 id 直接传 null
  // 让下游渲染一个"id 非法"的错误态，不打请求。
  const parsed = Number.parseInt(id, 10);
  const eventId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  return (
    <AdminGuard>
      <EditEventInner eventId={eventId} rawId={id} />
    </AdminGuard>
  );
}

function EditEventInner({
  eventId,
  rawId,
}: {
  eventId: number | null;
  rawId: string;
}) {
  const [event, setEvent] = useState<EventView | null>(null);
  const [loading, setLoading] = useState(eventId !== null);
  const [error, setError] = useState<string | null>(
    eventId === null ? `非法的活动 id: ${rawId}` : null,
  );

  useEffect(() => {
    if (eventId === null) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getAdminEvent(eventId);
        if (!cancelled) setEvent(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Link
          href="/admin/events"
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[#CC0000] transition-colors"
        >
          ← 返回活动列表
        </Link>
        <header className="mt-4 border-t-4 border-[var(--foreground)] pt-6 mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Admin · Events · Edit #{eventId ?? rawId}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
            编辑活动
          </h1>
        </header>

        {loading && (
          <p className="font-mono text-xs text-neutral-500">加载中…</p>
        )}
        {error && (
          <div className="border border-[#CC0000] p-4 text-sm text-[#CC0000] font-mono">
            {error}
          </div>
        )}
        {event && <EventForm initial={event} />}
      </div>
    </main>
  );
}
