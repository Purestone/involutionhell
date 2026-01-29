"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { activityEventsConfig, type ActivityEvent } from "@/app/types/event";
import { cn } from "@/lib/utils";
import { X, ChevronUp, ExternalLink, Play } from "lucide-react";
import styles from "./FloatWindow.module.css";

const { events: rawEvents, settings } = activityEventsConfig;
const { rotationIntervalMs, maxItems } = settings;

// 显示所有活动（包括存档的已过期活动）
// 优先显示未过期的活动，然后是已过期的
const sortedEvents = [
  ...rawEvents.filter((e) => !e.deprecated),
  ...rawEvents.filter((e) => e.deprecated),
].slice(0, maxItems);

const activeEvents = sortedEvents;

/**
 * FloatWindow - 复古报纸风格的活动预告悬浮窗
 * 具有皱纸纹理效果、自动轮播活动和复古美学
 * 仅在首页 (/) 可见
 */
export function FloatWindow() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 仅在首页显示
  const isHomePage = pathname === "/";

  // 自动轮播活动
  useEffect(() => {
    if (isCollapsed || isHovered || activeEvents.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeEvents.length);
        setIsAnimating(false);
      }, 300);
    }, rotationIntervalMs);

    return () => clearInterval(interval);
  }, [isCollapsed, isHovered]);

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

  const currentEvent: ActivityEvent = activeEvents[currentIndex];

  return (
    <div
      ref={(node) => {
        if (node) node.style.touchAction = "none";
      }}
      className={cn(
        "fixed z-50",
        !position && "bottom-6 right-6",
        !isDragging && "transition-all duration-500 ease-out",
        isCollapsed ? "w-auto" : "w-[340px]",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 折叠状态 - 极简标签 */}
      {isCollapsed ? (
        <button
          onClick={handleToggle}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "group flex items-center gap-3 px-4 py-3",
            "bg-[var(--background)] border-2 border-[var(--foreground)]",
            "font-mono text-xs uppercase tracking-widest",
            "hover:bg-[var(--foreground)] hover:text-[var(--background)]",
            "transition-all duration-200",
            "shadow-[4px_4px_0px_0px_var(--foreground)]",
            "hover:shadow-[6px_6px_0px_0px_var(--foreground)]",
            "hover:translate-x-[-2px] hover:translate-y-[-2px]",
          )}
        >
          <span className="w-2 h-2 bg-[#CC0000] animate-pulse" />
          <span className="font-bold">Events</span>
          <ChevronUp className="w-4 h-4 rotate-180 group-hover:translate-y-0.5 transition-transform" />
        </button>
      ) : (
        /* 展开状态 - 完整报纸卡片 */
        <div className="relative">
          {/* 具有陈旧纸张效果的主卡片 */}
          <div
            className={cn(
              styles.paperAged,
              styles.paperWornEdges,
              "relative overflow-hidden",
              "border-2 border-[#8B7355] dark:border-[#2a2520]",
              "shadow-[6px_6px_0px_0px_rgba(60,45,30,0.4)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]",
              "transition-shadow duration-200",
              isHovered &&
                "shadow-[8px_8px_0px_0px_rgba(60,45,30,0.5)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.7)]",
            )}
          >
            {/* 皱纸纹理覆盖层 */}
            <div
              className={cn(
                styles.paperCrumpleOverlay,
                "absolute inset-0 pointer-events-none z-20",
              )}
            />

            {/* 标题栏 - 类似报纸日期行 */}
            <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b-2 border-[#8B7355] dark:border-[#2a2520] bg-[#3d3428] dark:bg-[#1a1816] text-[#f5f0e6] dark:text-[#e8e4dc]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#CC0000]" />
                <span
                  className={cn(
                    styles.inkBleed,
                    "font-mono text-[10px] uppercase tracking-[0.2em] font-bold",
                  )}
                >
                  Bulletin Board
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggle}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-[#f5f0e6] hover:text-[#3d3428] transition-colors"
                  aria-label="Minimize"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismiss}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-[#CC0000] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 报头 - 报纸标题 */}
            <div className="relative z-10 px-4 pt-4 pb-2 border-b border-[#8B7355]/50 dark:border-[#3a3530]/50">
              <div className="flex items-baseline justify-between">
                <h3
                  className={cn(
                    styles.inkBleed,
                    styles.fadedPrint,
                    "font-serif text-2xl font-black italic tracking-tight text-[#2a2218] dark:text-[#f0ebe0]",
                  )}
                >
                  The Herald
                </h3>
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#8B7355] dark:text-[#8a8070]">
                  Vol. I
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-[#8B7355]/30 dark:border-[#5a5045]/40">
                <span className="font-mono text-[8px] uppercase text-[#8B7355] dark:text-[#8a8070]">
                  Community Events
                </span>
                <span className="font-mono text-[8px] uppercase text-[#8B7355] dark:text-[#8a8070]">
                  {activeEvents.length} Active
                </span>
              </div>
            </div>

            {/* 活动内容 */}
            <div
              className={cn(
                "relative z-10 transition-opacity duration-300",
                isAnimating && "opacity-0",
              )}
            >
              {/* 活动图片 */}
              <div className="relative aspect-[16/9] border-b border-[#8B7355]/50 dark:border-[#3a3530]/50 overflow-hidden">
                <Image
                  src={currentEvent.coverUrl}
                  alt={currentEvent.name}
                  fill
                  className="object-cover"
                  sizes="340px"
                  draggable={false}
                />
                {/* 复古照片覆盖层 */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(139,90,43,0.1) 0%, transparent 30%, transparent 70%, rgba(139,90,43,0.15) 100%)",
                    mixBlendMode: "multiply",
                  }}
                />
              </div>

              {/* 活动详情 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "shrink-0 px-2 py-1 font-mono text-[9px] uppercase tracking-tight leading-none",
                      currentEvent.deprecated
                        ? "bg-[#6a5d4d] dark:bg-[#4a4540] text-[#f5f0e6] dark:text-[#e8e4dc]"
                        : "bg-[#CC0000] text-white",
                    )}
                  >
                    {currentEvent.deprecated ? "Archive" : "Live"}
                  </span>
                  <h4
                    className={cn(
                      styles.inkBleed,
                      "font-serif text-lg font-bold leading-none text-[#2a2218] dark:text-[#f0ebe0]",
                    )}
                  >
                    {currentEvent.name}
                  </h4>
                </div>

                <p
                  className={cn(
                    styles.fadedPrint,
                    "font-body text-xs text-[#5a4d3d] dark:text-[#b5a898] leading-relaxed mb-4 text-justify",
                  )}
                >
                  {currentEvent.deprecated
                    ? "This event has concluded. Watch the playback to catch up on what you missed."
                    : "Join us for this community event. Connect with fellow developers, learn new skills, and grow together."}
                </p>

                {/* 操作按钮 - 仅单个按钮 */}
                {currentEvent.deprecated && currentEvent.playback ? (
                  <a
                    href={currentEvent.playback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 w-full",
                      "bg-[#3d3428] dark:bg-[#e8e4dc] text-[#f5f0e6] dark:text-[#1a1816]",
                      "border border-[#3d3428] dark:border-[#e8e4dc]",
                      "font-mono text-[10px] uppercase tracking-widest font-bold",
                      "hover:bg-[#CC0000] hover:border-[#CC0000] hover:text-white",
                      "transition-all duration-200",
                    )}
                  >
                    <Play className="w-3 h-3" />
                    Watch Playback
                  </a>
                ) : (
                  <a
                    href={currentEvent.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 w-full",
                      "bg-[#3d3428] dark:bg-[#e8e4dc] text-[#f5f0e6] dark:text-[#1a1816]",
                      "border border-[#3d3428] dark:border-[#e8e4dc]",
                      "font-mono text-[10px] uppercase tracking-widest font-bold",
                      "hover:bg-[#CC0000] hover:border-[#CC0000] hover:text-white",
                      "transition-all duration-200",
                    )}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Join Event
                  </a>
                )}
              </div>
            </div>

            {/* 页脚 - 分页点 */}
            {activeEvents.length > 1 && (
              <div className="relative z-10 flex items-center justify-center gap-2 px-4 py-3 border-t border-[#8B7355]/50 dark:border-[#3a3530]/50 bg-[#ebe5d8] dark:bg-[#0a0908]">
                {activeEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentIndex(idx);
                        setIsAnimating(false);
                      }, 300);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "w-2 h-2 border border-[#8B7355] dark:border-[#5a5045] transition-all duration-200",
                      idx === currentIndex
                        ? "bg-[#3d3428] dark:bg-[#e8e4dc]"
                        : "bg-transparent hover:bg-[#d5cfc2] dark:hover:bg-[#2a2520]",
                    )}
                    aria-label={`Go to event ${idx + 1}`}
                  />
                ))}
                <span className="ml-2 font-mono text-[8px] text-[#8B7355] dark:text-[#8a8070]">
                  {currentIndex + 1}/{activeEvents.length}
                </span>
              </div>
            )}

            {/* 装饰性撕角效果 */}
            <div
              className={cn(
                styles.tornCorner,
                "absolute top-0 right-0 w-8 h-8 pointer-events-none z-30",
              )}
            />

            {/* 底部撕边模拟 */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none z-30"
              style={{
                background: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 3px,
                  rgba(139, 90, 43, 0.1) 3px,
                  rgba(139, 90, 43, 0.1) 6px
                )`,
              }}
            />
          </div>

          {/* 后方的堆叠纸张效果 */}
          <div
            className={cn(
              styles.stackedPaper1,
              "absolute -bottom-1 -right-1 w-full h-full border -z-10",
            )}
            style={{ transform: "rotate(1deg)" }}
          />
          <div
            className={cn(
              styles.stackedPaper2,
              "absolute -bottom-2 -right-2 w-full h-full border -z-20",
            )}
            style={{ transform: "rotate(2deg)" }}
          />
        </div>
      )}
    </div>
  );
}

export default FloatWindow;
