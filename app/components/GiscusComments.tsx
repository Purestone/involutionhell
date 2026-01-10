"use client";

import { useEffect, useState } from "react";
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
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const calcResolved = (): "light" | "dark" => {
      if (theme === "system") {
        return media.matches ? "dark" : "light";
      }
      return theme === "dark" ? "dark" : "light";
    };

    setResolvedTheme(calcResolved());

    if (theme === "system") {
      const handler = () => setResolvedTheme(calcResolved());
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    return undefined;
  }, [theme]);

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
