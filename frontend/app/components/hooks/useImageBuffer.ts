"use client";

import { useCallback, useEffect, useRef } from "react";

export interface ImageBufferApi {
  appendFile: (file: File) => string;
  cleanupUnreferenced: (markdown: string) => number;
  clearAll: () => void;
  getSnapshot: () => Map<string, File>;
}

/**
 * 本地图片缓存，用于延迟上传流程
 */
export function useImageBuffer(
  onImagesChange?: (count: number) => void,
): ImageBufferApi {
  const imageMapRef = useRef<Map<string, File>>(new Map());

  const notifyImagesChange = useCallback(() => {
    onImagesChange?.(imageMapRef.current.size);
  }, [onImagesChange]);

  const appendFile = useCallback(
    (file: File) => {
      const blobUrl = URL.createObjectURL(file);
      imageMapRef.current.set(blobUrl, file);
      notifyImagesChange();
      return blobUrl;
    },
    [notifyImagesChange],
  );

  const cleanupUnreferenced = useCallback(
    (markdown: string) => {
      let removed = 0;
      imageMapRef.current.forEach((_, blobUrl) => {
        if (!markdown.includes(blobUrl)) {
          URL.revokeObjectURL(blobUrl);
          imageMapRef.current.delete(blobUrl);
          removed += 1;
        }
      });

      if (removed > 0) {
        notifyImagesChange();
      }

      return removed;
    },
    [notifyImagesChange],
  );

  const clearAll = useCallback(() => {
    if (imageMapRef.current.size === 0) return;
    imageMapRef.current.forEach((_, blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    imageMapRef.current.clear();
    notifyImagesChange();
  }, [notifyImagesChange]);

  const getSnapshot = useCallback(() => new Map(imageMapRef.current), []);

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return { appendFile, cleanupUnreferenced, clearAll, getSnapshot };
}
