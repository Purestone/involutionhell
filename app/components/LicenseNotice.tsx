import Image from "next/image";
import { cn } from "@/lib/utils";

interface LicenseNoticeProps {
  className?: string;
}

export function LicenseNotice({ className }: LicenseNoticeProps) {
  return (
    <p
      className={cn(
        "license-notice flex flex-wrap items-center gap-x-1 gap-y-2 text-[10px] uppercase tracking-wider font-mono text-neutral-400",
        className,
      )}
    >
      <a
        href="https://involutionhell.com"
        className="text-neutral-500 hover:text-[#CC0000]"
      >
        Involution Hell
      </a>
      <span>&copy; 2026 by</span>
      <a
        href="https://github.com/InvolutionHell"
        className="text-neutral-500 hover:text-[#CC0000]"
      >
        Community
      </a>
      <span>under</span>
      <a
        href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
        className="underline decoration-1 underline-offset-2"
      >
        CC BY-NC-SA 4.0
      </a>
      {/*
        CC 图标改为本地托管（public/cc-icons/）。
        原来走 mirrors.creativecommons.org 外链，每个图标 ~960ms（国内延迟 + 可能被墙），
        4 个图标就是近 4s 额外网络开销。每个 SVG ~1KB，本地走站内 CDN 毫秒级返回。
      */}
      <span className="flex items-center gap-0.5 opacity-50">
        <Image
          src="/cc-icons/cc.svg"
          alt="CC"
          width={10}
          height={10}
          loading="lazy"
        />
        <Image
          src="/cc-icons/by.svg"
          alt="BY"
          width={10}
          height={10}
          loading="lazy"
        />
        <Image
          src="/cc-icons/nc.svg"
          alt="NC"
          width={10}
          height={10}
          loading="lazy"
        />
        <Image
          src="/cc-icons/sa.svg"
          alt="SA"
          width={10}
          height={10}
          loading="lazy"
        />
      </span>
    </p>
  );
}
