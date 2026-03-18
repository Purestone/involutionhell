"use client";

import { useEffect } from "react";

export function CopyTracking() {
  useEffect(() => {
    // 监听全局 Copy 事件
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
      // 判断选中节点是否包含在 <pre> 或 <code> 标签内，区分代码块复制
        type = "code";
      }

      // Umami 埋点: 记录复制行为，区分文本/代码类型和复制长度
      if (window.umami) {
        window.umami.track("content_copy", {
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
