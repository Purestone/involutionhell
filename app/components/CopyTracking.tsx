"use client";

import { useEffect } from "react";

export function CopyTracking() {
  useEffect(() => {
    const handleCopy = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString();
      if (!text) return;

      // Determine if it's code or text
      let type = "text";
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;

      const isCode = (node: Node | null) => {
        let current = node;
        while (current) {
          if (
            current.nodeName === "PRE" ||
            current.nodeName === "CODE" ||
            (current instanceof Element &&
              (current.classList.contains("code-block") ||
                current.tagName === "PRE" ||
                current.tagName === "CODE"))
          ) {
            return true;
          }
          current = current.parentNode;
        }
        return false;
      };

      if (isCode(anchorNode) || isCode(focusNode)) {
        type = "code";
      }

      if (window.umami) {
        window.umami.track("prose_copy", {
          type,
          content_length: text.length,
        });
      }
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  return null;
}
