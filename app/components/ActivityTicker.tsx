"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  activityEventsConfig,
  type ActivityEvent,
  type ActivityTickerSettings,
} from "@/app/types/event";
import { cn } from "@/lib/utils";

const { events: rawEvents, settings } = activityEventsConfig;

const {
  maxItems: configuredMaxItems = 3,
  rotationIntervalMs: configuredRotationIntervalMs = 8000,
}: ActivityTickerSettings = settings;

// 默认配置，从data/event.json中读取配置
const MAX_ITEMS = configuredMaxItems;
const ROTATION_INTERVAL_MS = configuredRotationIntervalMs;

/** ActivityTicker 外部传入的样式配置 */
type ActivityTickerProps = {
  /** 容器额外类名，用于控制宽度与定位 */
  className?: string;
};

/**
 * 首页活动轮播组件：
 * - 读取 event.json 配置的活动数量
 * - 自动轮播封面图，顶部指示器支持手动切换
 * - 底部两个毛玻璃按钮：Discord 永远可见，Playback 仅在 deprecated=true 时显示
 */
export function ActivityTicker({ className }: ActivityTickerProps) {
  // 预处理活动列表，保持初次渲染后的引用稳定
  const events = useMemo<ActivityEvent[]>(() => {
    return rawEvents.slice(0, MAX_ITEMS);
  }, []);

  // 当前展示的活动索引
  const [activeIndex, setActiveIndex] = useState(0);
  const totalEvents = events.length;

  // 控制浮窗显隐
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (isClosed || totalEvents <= 1) {
      return;
    }

    // 定时轮播，间隔 ROTATION_INTERVAL_MS
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalEvents);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [totalEvents, activeIndex, isClosed]);

  const handlePrev = useCallback(() => {
    if (totalEvents <= 1) {
      return;
    }
    setActiveIndex((prev) => (prev - 1 + totalEvents) % totalEvents);
  }, [totalEvents]);

  const handleNext = useCallback(() => {
    if (totalEvents <= 1) {
      return;
    }
    setActiveIndex((prev) => (prev + 1) % totalEvents);
  }, [totalEvents]);

  if (totalEvents === 0) {
    return null;
  }

  if (isClosed) {
    return null;
  }

  const activeEvent = events[activeIndex];
  const coverSrc = activeEvent.coverUrl;
  const showPlayback = activeEvent.deprecated && Boolean(activeEvent.playback);

  return (
    <div className="flex items-center w-full h-8 overflow-hidden group">
      <div className="flex items-center gap-4 animate-in slide-in-from-right duration-500">
        <span className="bg-[#CC0000] text-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-tighter shrink-0">
          Update
        </span>
        <Link
          href={activeEvent.discord}
          className="font-sans text-xs font-bold uppercase tracking-widest hover:text-[#CC0000] truncate"
        >
          {activeEvent.name} —{" "}
          {activeEvent.deprecated ? "Archives Available" : "Event Active"}
        </Link>
        <span className="text-neutral-400 font-mono text-[10px]">&bull;</span>
        <span className="font-mono text-[10px] text-neutral-500 uppercase">
          Edition 1.0.0
        </span>
      </div>

      <div className="ml-auto flex border-l border-[#111111] h-full">
        <button
          onClick={handlePrev}
          className="px-3 hover:bg-[#111111] hover:text-white transition-colors border-r border-[#111111]"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <button
          onClick={handleNext}
          className="px-3 hover:bg-[#111111] hover:text-white transition-colors"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
