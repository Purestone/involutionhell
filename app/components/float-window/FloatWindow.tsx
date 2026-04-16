"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import type { HomepageEvent } from "@/lib/events-fetch";
import { cn } from "@/lib/utils";
import { X, ChevronUp, ExternalLink, Play } from "lucide-react";
import styles from "./FloatWindow.module.css";

/**
 * FloatWindow - 复古报纸风格的活动预告悬浮窗。
 * 仅显示最新的一条活动，仅在首页 (/) 可见。
 *
 * 数据来源：
 * - 之前从 data/event.json 直接 import
 * - 现在由上游 Server Component（app/page.tsx）调 lib/events-fetch.ts 拉 /api/events
 *   后通过 event prop 传进来；后端失败时 fetch 内部会 fallback 到 JSON
 */

interface FloatWindowProps {
  /** 要展示的单条活动；null 或已过期时组件不渲染 */
  event: HomepageEvent | null;
}

export function FloatWindow({ event }: FloatWindowProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 仅在首页 (/) 可见
  const isHomePage = pathname === "/";

  const handleDismiss = useCallback(() => setIsDismissed(true), []);
  const handleToggle = useCallback(() => setIsCollapsed((prev) => !prev), []);

  if (!isHomePage || isDismissed || !event || event.deprecated) return null;

  const currentEvent = event;

  return (
    <motion.div
      layout
      drag
      dragMomentum={false}
      whileDrag={{ cursor: "grabbing" }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed z-50 bottom-6 right-6",
        isCollapsed ? "w-auto" : "w-[280px]",
        "cursor-grab active:cursor-grabbing", // tailwind fallback cursor
      )}
      onPointerDown={(e) => e.stopPropagation()} // Prevent conflicts
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggle}
            className={cn(
              "group flex items-center gap-2 px-4 py-2",
              // Newsprint 风格：锐利边角，纯黑实线边框
              "bg-[#111111] text-[#F9F9F7] border border-[#111111]",
              "hover:bg-[#F9F9F7] hover:text-[#111111]", // 悬停时反色
              "font-mono text-xs uppercase tracking-widest",
              "transition-colors duration-200",
              "shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]",
            )}
          >
            <span className="w-2 h-2 bg-[#CC0000] animate-pulse" />
            <span className="font-bold">Latest</span>
            <ChevronUp className="w-4 h-4 rotate-180 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        ) : (
          /* 展开状态 - 报纸卡片 */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              styles.newsprintTexture,
              styles.hardShadowHover,
              "relative border border-[#111111] dark:border-[#F9F9F7]", // 显式边框
              "flex flex-col",
            )}
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#111111] dark:border-[#F9F9F7] bg-[#111111] dark:bg-[#F9F9F7]">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#F9F9F7] dark:text-[#111111]">
                The Daily Feed
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggle}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[#F9F9F7] dark:text-[#111111] hover:text-[#CC0000] transition-colors"
                  aria-label="Minimize"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDismiss}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[#F9F9F7] dark:text-[#111111] hover:text-[#CC0000] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-0">
              {/* 图片区域 - 默认为灰度（暗黑模式除外） */}
              <div className="relative aspect-[16/9] border-b border-[#111111] dark:border-[#F9F9F7] overflow-hidden group">
                <Image
                  src={currentEvent.coverUrl}
                  alt={currentEvent.name}
                  fill
                  className="object-cover transition-all duration-500"
                  sizes="280px"
                  draggable={false}
                />
                {/* 突发新闻徽章 */}
                {!currentEvent.deprecated && (
                  <div className="absolute top-2 left-2 bg-[#CC0000] text-white px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase font-bold">
                    Breaking
                  </div>
                )}
              </div>

              {/* 标题与描述 */}
              <div className="p-4 bg-transparent">
                <h4 className="font-serif text-lg font-bold leading-tight text-[#111111] dark:text-[#F9F9F7] mb-2">
                  {currentEvent.name}
                </h4>
                <p className="font-serif text-sm leading-relaxed text-[#111111]/80 dark:text-[#F9F9F7]/80 line-clamp-3 mb-4 text-justify">
                  {currentEvent.deprecated
                    ? "This event has concluded. View the archives for full coverage."
                    : "Join us for this significant community event. Detailed coverage inside."}
                </p>

                {/* 操作按钮 */}
                {currentEvent.deprecated && currentEvent.playback ? (
                  <a
                    href={currentEvent.playback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full px-4 py-2",
                      "border border-[#111111] dark:border-[#F9F9F7]",
                      "bg-transparent hover:bg-[#111111] hover:text-[#F9F9F7]",
                      "dark:hover:bg-[#F9F9F7] dark:hover:text-[#111111]",
                      "font-mono text-xs uppercase tracking-widest font-bold",
                      "transition-colors duration-200",
                    )}
                  >
                    <Play className="w-3 h-3" />
                    <span>Watch Replay</span>
                  </a>
                ) : (
                  <a
                    href={currentEvent.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full px-4 py-2",
                      "bg-[#111111] text-[#F9F9F7]",
                      "hover:bg-[#CC0000] hover:border-[#CC0000]",
                      "font-mono text-xs uppercase tracking-widest font-bold",
                      "transition-colors duration-200",
                    )}
                  >
                    <span>Read More</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FloatWindow;
