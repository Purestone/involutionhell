"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { activityEventsConfig } from "@/app/types/event";
import { cn } from "@/lib/utils";
import { X, ChevronUp, ExternalLink, Play } from "lucide-react";
import styles from "./FloatWindow.module.css";

const { events: rawEvents } = activityEventsConfig;

// 显示所有活动（包括存档的已过期活动）
// 优先显示未过期的活动，然后是已过期的
const sortedEvents = [
  ...rawEvents.filter((e) => !e.deprecated),
  ...rawEvents.filter((e) => e.deprecated),
];

const activeEvents = sortedEvents.slice(0, 3);

/**
 * FloatWindow - 复古报纸/通缉令风格的活动悬浮窗
 * 9:16 比例，显示最新的3个活动
 * 仅在首页 (/) 可见
 */
export function FloatWindow() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 仅在首页显示
  const isHomePage = pathname === "/";

  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  // Store the offset from the top-left of the element to the mouse pointer
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent drag if using right click or if interacting with inputs
    if (e.button !== 0) return;

    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // If it's the first time dragging (position is null), we need to set the initial position
    // based on the current computed rect, so it doesn't jump.
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }

    // Capture pointer to track movement even outside the window
    el.setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const handleToggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // 如果不在首页、已关闭或无活动，则不渲染
  if (!isHomePage || isDismissed || activeEvents.length === 0) {
    return null;
  }

  const currentEvent = activeEvents[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeEvents.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + activeEvents.length) % activeEvents.length,
    );
  };

  return (
    <div
      ref={(node) => {
        if (node) node.style.touchAction = "none";
      }}
      className={cn(
        "fixed z-50 transition-all duration-500 ease-out",
        !position && "bottom-6 right-6",
        isCollapsed ? "w-auto" : "w-[280px]", // 稍微加宽一点以适应海报内容
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerDown={handlePointerDown}
    >
      {/* 折叠状态 - 极简标签 */}
      {isCollapsed ? (
        <button
          onClick={handleToggle}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "group flex items-center gap-2 px-3 py-2",
            "bg-[var(--background)] border-2 border-[var(--foreground)]",
            "font-mono text-[10px] uppercase tracking-widest",
            "hover:bg-[var(--foreground)] hover:text-[var(--background)]",
            "transition-all duration-200",
            "shadow-[3px_3px_0px_0px_var(--foreground)]",
            "hover:shadow-[4px_4px_0px_0px_var(--foreground)]",
            "hover:translate-x-[-1px] hover:translate-y-[-1px]",
          )}
        >
          <span className="w-1.5 h-1.5 bg-[#CC0000] animate-pulse" />
          <span className="font-bold">Latest</span>
          <ChevronUp className="w-3 h-3 rotate-180 group-hover:translate-y-0.5 transition-transform" />
        </button>
      ) : (
        /* 展开状态 - 完整报纸卡片 */
        /* 展开状态 - 完整通缉令/海报风格 */
        <div className="relative">
          {/* 具有陈旧牛皮纸效果的主卡片 */}
          <div
            className={cn(
              styles.paperAged,
              styles.paperWornEdges,
              "relative overflow-hidden flex flex-col",
              // "aspect-[9/16]", // Removed to allow flexible height based on content
              "border-4 border-[#3d2e1e] dark:border-[#1a120b]", // 更粗的边框
              "shadow-[8px_8px_15px_rgba(0,0,0,0.5)]",
            )}
          >
            {/* 皱纸纹理覆盖层 */}
            <div
              className={cn(
                styles.paperCrumpleOverlay,
                "absolute inset-0 pointer-events-none z-20",
              )}
            />

            {/* 顶部打孔效果 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#1a120b] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)] z-30" />

            {/* 功能按钮 - 绝对定位在右上角 */}
            <div className="absolute top-2 right-2 z-50 flex gap-1">
              <button
                onClick={handleToggle}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 hover:bg-[#3d2e1e] hover:text-[#e8dcc5] rounded-full transition-colors text-[#5a4d3d] dark:text-[#b5a898]"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 hover:bg-[#8b0000] hover:text-white rounded-full transition-colors text-[#5a4d3d] dark:text-[#b5a898]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* WANTED 风格大标题 */}
            <div className="relative z-10 pt-8 pb-2 text-center border-b-2 border-[#3d2e1e] dark:border-[#2a2520]">
              <h1 className="font-serif text-4xl font-black tracking-widest text-[#3d2e1e] dark:text-[#2a2520] uppercase scale-y-125">
                {currentEvent.deprecated ? "ARCHIVED" : "WANTED"}
              </h1>
              <div className="mt-1 font-mono text-[10px] tracking-[0.3em] font-bold text-[#5a4d3d] uppercase">
                {currentEvent.deprecated ? "For Reference" : "Developers"}
              </div>
            </div>

            {/* 活动内容 */}
            <div className="relative z-10 flex-1 flex flex-col px-4 py-3 min-h-0">
              {/* 活动图片 - 拍立得风格 */}
              <div className="relative shrink-0 mx-auto w-full aspect-square bg-[#f0f0f0] p-1.5 shadow-md rotate-1 border border-[#ccc]">
                <div className="relative w-full h-full grayscale-[0.2] contrast-110 sepia-[0.3]">
                  <Image
                    src={currentEvent.coverUrl}
                    alt={currentEvent.name}
                    fill
                    className="object-cover"
                    sizes="240px"
                    draggable={false}
                  />
                  {/* 划痕效果 */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                </div>
              </div>

              {/* 活动详情 */}
              <div className="flex-1 flex flex-col justify-center mt-3 text-center">
                <h4
                  className={cn(
                    styles.inkBleed,
                    "font-serif text-xl font-bold leading-tight text-[#2a2218] dark:text-[#f0ebe0] mb-2 uppercase",
                  )}
                >
                  {currentEvent.name}
                </h4>

                <p
                  className={cn(
                    styles.fadedPrint,
                    "font-serif text-xs text-[#5a4d3d] dark:text-[#b5a898] leading-tight italic line-clamp-3 mb-2",
                  )}
                >
                  {currentEvent.deprecated
                    ? "This legendary event has been recorded in our archives."
                    : "Join the ranks. Accept the challenge. Code needs you."}
                </p>

                {/* 操作按钮 */}
                <div className="mt-auto pt-2">
                  <a
                    href={
                      currentEvent.deprecated
                        ? currentEvent.playback
                        : currentEvent.discord
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "inline-block w-full py-2 px-4",
                      "bg-[#3d2e1e] text-[#e8dcc5]",
                      "font-serif font-bold text-sm tracking-widest uppercase",
                      "border-2 border-[#3d2e1e]",
                      "hover:bg-[#8b0000] hover:border-[#8b0000] hover:text-white",
                      "transition-all transform hover:scale-105",
                      "shadow-[2px_2px_0px_rgba(0,0,0,0.3)]",
                    )}
                  >
                    {currentEvent.deprecated ? "WATCH RECORD" : "APPLY NOW"}
                  </a>
                </div>
              </div>
            </div>

            {/* 底部导航 */}
            {activeEvents.length > 1 && (
              <div className="relative z-10 mx-3 mb-3 pt-2 border-t-2 border-dashed border-[#3d2e1e]/30 flex items-center justify-between font-mono text-xs font-bold text-[#3d2e1e]">
                <button
                  onClick={handlePrev}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="hover:scale-110 transition-transform px-2"
                >
                  ◄ PREV
                </button>
                <span>
                  {currentIndex + 1} / {activeEvents.length}
                </span>
                <button
                  onClick={handleNext}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="hover:scale-110 transition-transform px-2"
                >
                  NEXT ►
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatWindow;
