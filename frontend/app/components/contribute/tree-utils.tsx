"use client";

import { Plus } from "lucide-react";
import type { DefaultOptionType } from "antd/es/select";
import type { DirNode } from "@/lib/submission";

export const CREATE_SUBDIR_SUFFIX = "/__create__";

export function toTreeSelectData(tree: DirNode[]): DefaultOptionType[] {
  return tree.map((l1) => ({
    key: l1.path,
    value: l1.path,
    label: l1.name,
    selectable: false,
    children: [
      ...(l1.children || []).map((l2) => ({
        key: l2.path,
        value: l2.path,
        label: `${l1.name} / ${l2.name}`,
        isLeaf: true,
      })),
      {
        key: `${l1.path}${CREATE_SUBDIR_SUFFIX}`,
        value: `${l1.path}${CREATE_SUBDIR_SUFFIX}`,
        label: (
          <span className="inline-flex items-center">
            <Plus className="mr-1 h-3.5 w-3.5" />
            在「{l1.name}」下新建二级子栏目…
          </span>
        ),
      },
    ],
  }));
}
