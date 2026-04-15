"use client";

import { useState } from "react";
import Link from "next/link";

interface ProfileCardProps {
  kind: "PROJ" | "PAPER" | "DOC";
  index: number;
  title: string;
  meta?: string;
  summary?: string;
  /** 展开态显示的详细内容（hover / tap 触发），没有则复用 summary */
  detail?: string;
  href?: string;
  /** DOC 汇总卡占两列；其他卡片单列 */
  spanFull?: boolean;
}

/**
 * 个人主页小卡：静态展示 SEC 编号 + 标题 + meta + 概述；
 * 悬停（desktop）或点击（mobile）展开详情段落，用 max-height 原地展开避免布局抖动。
 *
 * 设计刻意用 editorial 硬朗风格：无圆角、1px border、hover 加硬阴影，
 * 和站内 Classified Archives / Top Rank 小卡统一。
 */
export function ProfileCard({
  kind,
  index,
  title,
  meta,
  summary,
  detail,
  href,
  spanFull,
}: ProfileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const kindLabel = {
    PROJ: "Project",
    PAPER: "Paper",
    DOC: "Docs",
  }[kind];

  return (
    <article
      // onClick 提供 mobile tap toggle；desktop 的 hover 通过 group-hover 样式实现
      onClick={() => setExpanded((v) => !v)}
      className={[
        "group relative border border-[var(--foreground)] bg-[var(--background)]",
        "p-6 flex flex-col gap-3 min-h-[180px] cursor-pointer",
        "transition-shadow duration-200 ease-out",
        "hover:shadow-[6px_6px_0_var(--foreground)]",
        spanFull ? "sm:col-span-2" : "",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          SEC. {kind} · {String(index).padStart(3, "0")}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
          {kindLabel}
        </span>
      </div>

      <h3 className="font-serif text-lg md:text-xl font-bold leading-tight text-[var(--foreground)] line-clamp-2">
        {title}
      </h3>

      {meta && (
        <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 line-clamp-1">
          {meta}
        </p>
      )}

      {summary && (
        <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300 line-clamp-2">
          {summary}
        </p>
      )}

      {/* 展开态：hover（desktop）或点击（mobile）打开；用 max-height 过渡 */}
      {detail && (
        <div
          className={[
            "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
            "lg:group-hover:max-h-80 lg:group-hover:opacity-100",
            "lg:group-focus-within:max-h-80 lg:group-focus-within:opacity-100",
            expanded
              ? "max-h-80 opacity-100 mt-2 pt-3 border-t border-[var(--foreground)]"
              : "max-h-0 opacity-0 lg:group-hover:mt-2 lg:group-hover:pt-3 lg:group-hover:border-t lg:group-hover:border-[var(--foreground)]",
          ].join(" ")}
        >
          <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
            {detail}
          </p>
        </div>
      )}

      {href && (
        <div className="mt-auto pt-3">
          <Link
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000] hover:underline"
          >
            View →
          </Link>
        </div>
      )}
    </article>
  );
}
