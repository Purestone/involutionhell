"use client";

import { useEffect, useMemo, useState } from "react";
import Giscus from "@giscus/react";
import { useTheme } from "./ThemeProvider";

interface GiscusCommentsProps {
  className?: string;
  docId?: string | null;
}

export function GiscusComments({ className, docId }: GiscusCommentsProps) {
  const { theme } = useTheme();
  const normalizedDocId = typeof docId === "string" ? docId.trim() : "";
  const useSpecificMapping = normalizedDocId.length > 0;
  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) =>
      setIsSystemDark(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      return isSystemDark ? "dark" : "light";
    }
    return theme === "dark" ? "dark" : "light";
  }, [isSystemDark, theme]);

  return (
    <div className={className}>
      <Giscus
        key={resolvedTheme} // force re-render when theme changes
        repo="InvolutionHell/involutionhell"
        repoId="R_kgDOPuD_8A"
        category="Comments"
        categoryId="DIC_kwDOPuD_8M4Cvip8"
        mapping={useSpecificMapping ? "specific" : "pathname"}
        term={useSpecificMapping ? normalizedDocId : undefined}
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={resolvedTheme}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
