"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { activityEventsConfig } from "@/app/types/event";
import { cn } from "@/lib/utils";
import { X, ChevronUp, ExternalLink, Play } from "lucide-react";
import styles from "./FloatWindow.module.css";

const { events: rawEvents, settings } = activityEventsConfig;
const { maxItems } = settings;

// 显示所有活动（包括存档的已过期活动）
// 优先显示未过期的活动，然后是已过期的
const sortedEvents = [
  ...rawEvents.filter((e) => !e.deprecated),
  ...rawEvents.filter((e) => e.deprecated),
].slice(0, maxItems);

const latestEvent = sortedEvents[0];

/**
 * FloatWindow - 复古报纸风格的活动预告悬浮窗
 * 仅显示最新的一条活动
 * 仅在首页 (/) 可见
 */
export function FloatWindow() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  if (!isHomePage || isDismissed || !latestEvent) {
    return null;
  }

  const currentEvent = latestEvent;

  return (
    <div
      ref={(node) => {
        if (node) node.style.touchAction = "none";
      }}
      className={cn(
        "fixed z-50",
        !position && "bottom-6 right-6",
        !isDragging && "transition-all duration-500 ease-out",
        isCollapsed ? "w-auto" : "w-[260px]",
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
        <div className="relative">
          {/* 具有陈旧纸张效果的主卡片 */}
          <div
            className={cn(
              styles.paperAged,
              styles.paperWornEdges,
              "relative overflow-hidden",
              "border border-[#8B7355] dark:border-[#2a2520]",
              "shadow-[4px_4px_0px_0px_rgba(60,45,30,0.4)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]",
              "transition-shadow duration-200",
              isHovered &&
                "shadow-[6px_6px_0px_0px_rgba(60,45,30,0.5)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.7)]",
            )}
          >
            {/* 皱纸纹理覆盖层 */}
            <div
              className={cn(
                styles.paperCrumpleOverlay,
                "absolute inset-0 pointer-events-none z-20",
              )}
            />

            {/* 简化的顶部栏 */}
            <div className="relative z-10 flex items-center justify-between px-3 py-1.5 border-b border-[#8B7355]/30 dark:border-[#2a2520] bg-[#3d3428]/5 dark:bg-[#1a1816]/30">
              <span
                className={cn(
                  styles.inkBleed,
                  "font-mono text-[9px] uppercase tracking-wider font-bold text-[#8B7355] dark:text-[#8a8070]",
                )}
              >
                The Daily Feed
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggle}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-0.5 hover:bg-[#8B7355]/10 rounded transition-colors text-[#5a4d3d] dark:text-[#b5a898]"
                  aria-label="Minimize"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDismiss}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-0.5 hover:bg-[#CC0000] hover:text-white rounded transition-colors text-[#5a4d3d] dark:text-[#b5a898]"
                  aria-label="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 活动内容 */}
            <div className="relative z-10">
              {/* 活动图片 - 更紧凑 */}
              <div className="relative aspect-[2/1] border-b border-[#8B7355]/30 dark:border-[#3a3530]/30 overflow-hidden">
                <Image
                  src={currentEvent.coverUrl}
                  alt={currentEvent.name}
                  fill
                  className="object-cover"
                  sizes="260px"
                  draggable={false}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(139,90,43,0.1) 0%, transparent 40%, transparent 60%, rgba(139,90,43,0.1) 100%)",
                    mixBlendMode: "multiply",
                  }}
                />
              </div>

              {/* 活动详情 - 更紧凑 */}
              <div className="p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className={cn(
                      "shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full",
                      currentEvent.deprecated ? "bg-[#6a5d4d]" : "bg-[#CC0000]",
                    )}
                  />
                  <h4
                    className={cn(
                      styles.inkBleed,
                      "font-serif text-sm font-bold leading-tight text-[#2a2218] dark:text-[#f0ebe0]",
                    )}
                  >
                    {currentEvent.name}
                  </h4>
                </div>

                <p
                  className={cn(
                    styles.fadedPrint,
                    "font-body text-[10px] text-[#5a4d3d] dark:text-[#b5a898] leading-relaxed mb-3 line-clamp-3",
                  )}
                >
                  {currentEvent.deprecated
                    ? "This event has concluded."
                    : "Join us for this community event to learn and grow."}
                </p>

                {/* 操作按钮 - 小巧版 */}
                {currentEvent.deprecated && currentEvent.playback ? (
                  <a
                    href={currentEvent.playback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2 py-1.5 w-full",
                      "bg-[#3d3428] dark:bg-[#e8e4dc] text-[#f5f0e6] dark:text-[#1a1816]",
                      "font-mono text-[9px] uppercase tracking-wider font-bold",
                      "hover:bg-[#CC0000] hover:text-white transition-colors",
                    )}
                  >
                    <Play className="w-2.5 h-2.5" />
                    Replay
                  </a>
                ) : (
                  <a
                    href={currentEvent.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2 py-1.5 w-full",
                      "bg-[#3d3428] dark:bg-[#e8e4dc] text-[#f5f0e6] dark:text-[#1a1816]",
                      "font-mono text-[9px] uppercase tracking-wider font-bold",
                      "hover:bg-[#CC0000] hover:text-white transition-colors",
                    )}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Join
                  </a>
                )}
              </div>
            </div>

            {/* 装饰性撕角效果 */}
            <div
              className={cn(
                styles.tornCorner,
                "absolute top-0 right-0 w-6 h-6 pointer-events-none z-30",
              )}
            />
          </div>

          {/* 后方的堆叠纸张效果 - 减淡 */}
          <div
            className={cn(
              styles.stackedPaper1,
              "absolute -bottom-0.5 -right-0.5 w-full h-full border -z-10",
            )}
            style={{ transform: "rotate(1deg)" }}
          />
        </div>
      )}
    </div>
  );
}

export default FloatWindow;
