"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.umami) {
      window.umami.track("error_404", {
        path: pathname,
        referrer: document.referrer || "direct",
      });
    }
  }, [pathname]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="bg-[url('/cloud_2.png')] bg-cover bg-center absolute inset-0 opacity-10 pointer-events-none" />
      <div className="z-10 flex flex-col items-center space-y-6 text-center">
        <h1 className="text-9xl font-black italic tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest">
          Page Not Found / 页面未找到
        </h2>
        <p className="max-w-md text-muted-foreground">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <p className="max-w-md text-muted-foreground font-serif italic">
          您寻找的页面可能已被移除、更名或暂时无法访问。
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">Return Home / 返回首页</Link>
        </Button>
      </div>
    </div>
  );
}
