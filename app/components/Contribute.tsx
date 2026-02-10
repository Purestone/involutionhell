"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExternalLink, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

// --- antd
import { TreeSelect } from "antd";
import { DataNode } from "antd/es/tree";
import { buildDocsNewUrl } from "@/lib/github";
import {
  FILENAME_PATTERN,
  normalizeFilenameBase,
  type DirNode,
} from "@/lib/submission";
import {
  CREATE_SUBDIR_SUFFIX,
  toTreeSelectData,
} from "@/app/components/contribute/tree-utils";
import { sanitizeDocumentSlug } from "@/lib/sanitizer";

// 统一调用工具函数生成 GitHub 新建链接，路径规则与 Edit 按钮一致
function buildGithubNewUrl(dirPath: string, filename: string, title: string) {
  const file = filename.endsWith(".md") ? filename : `${filename}.md`;
  const frontMatter = `---
title: '${title || "New Article"}'
description: ""
date: "${new Date().toISOString().slice(0, 10)}"
tags:
  - tag-one
---

# ${title || "New Article"}

Write your content here.
`;
  const params = new URLSearchParams({ filename: file, value: frontMatter });
  return buildDocsNewUrl(dirPath, params);
}

export function Contribute() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<DirNode[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Hooks 必须在组件内部
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]); // 受控展开状态
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [newSub, setNewSub] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleFile, setArticleFile] = useState("");
  const [articleFileTouched, setArticleFileTouched] = useState(false);

  const normalizedArticleFile = useMemo(
    () => normalizeFilenameBase(articleFile),
    [articleFile],
  );
  const { isFileNameValid, fileNameError } = useMemo(() => {
    if (!normalizedArticleFile) {
      return {
        isFileNameValid: false,
        fileNameError: "请填写文件名。",
      };
    }
    if (!FILENAME_PATTERN.test(normalizedArticleFile)) {
      return {
        isFileNameValid: false,
        fileNameError:
          "文件名仅支持字母、数字、连字符或下划线，并需以字母或数字开头。",
      };
    }
    return { isFileNameValid: true, fileNameError: "" };
  }, [normalizedArticleFile]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/docs-tree", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data?.ok) setTree(data.tree || []);
      } catch {
        const res = await fetch("/docs-tree.json").catch(() => null);
        const data = await res?.json();
        if (mounted && data?.ok) setTree(data.tree || []);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => toTreeSelectData(tree), [tree]);

  const sanitizedSubdir = useMemo(
    () => sanitizeDocumentSlug(newSub, ""),
    [newSub],
  );

  const finalDirPath = useMemo(() => {
    if (!selectedKey) return "";
    if (selectedKey.endsWith(CREATE_SUBDIR_SUFFIX)) {
      const l1 = selectedKey.split("/")[0];
      if (!l1 || !sanitizedSubdir) return "";
      return `${l1}/${sanitizedSubdir}`;
    }
    return selectedKey;
  }, [selectedKey, sanitizedSubdir]);

  const canProceed = !!finalDirPath && isFileNameValid;

  const handleOpenGithub = () => {
    if (!canProceed) return;
    if (!normalizedArticleFile) return;
    const filename = normalizedArticleFile;
    const title = articleTitle || filename;
    if (filename !== articleFile) {
      setArticleFile(filename);
    }

    if (window.umami) {
      window.umami.track("contribute_github_redirect", {
        dir: finalDirPath,
        filename: filename,
      });
    }

    window.open(
      buildGithubNewUrl(finalDirPath, filename, title),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelectedKey("");
          setNewSub("");
          setArticleTitle("");
          setArticleFile("");
          setArticleFileTouched(false);
        }
      }}
    >
      <div className="relative mt-12 inline-flex w-full sm:w-auto">
        <DialogTrigger asChild>
          <Button
            variant="hero"
            size="lg"
            className="relative isolate w-full sm:w-auto h-20 px-14 rounded-none
                     text-2xl font-serif font-black uppercase italic tracking-tighter
                     bg-[var(--foreground)] text-[var(--background)] border border-[var(--foreground)]
                     hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-all duration-300"
            data-umami-event="contribute_trigger"
            data-umami-event-location="hero"
            onClick={(event) => {
              event.preventDefault();
              router.push("/editor");
            }}
          >
            <span className="relative z-10 flex items-center gap-4">
              <Sparkles className="h-6 w-6" />
              <span>Submit Contribution / 投稿 </span>
            </span>
          </Button>
        </DialogTrigger>
        {/* 跳转的投稿指南 */}
        <a
          href="https://github.com/InvolutionHell/involutionhell?tab=contributing-ov-file#%E6%8A%95%E7%A8%BF%E6%8C%87%E5%8D%97"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="查看投稿指南"
          title="查看投稿指南"
          className="absolute top-0 right-0 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] font-mono hover:bg-[#CC0000] hover:text-white transition-colors z-20"
        >
          <span className="text-sm font-bold">?</span>
          <span className="sr-only">查看投稿指南</span>
        </a>
      </div>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>我要投稿</DialogTitle>
          <DialogDescription>
            选择栏目（单选、可搜索；一级仅用于展开），或在一级下新建二级子栏目，然后跳转到
            GitHub 新建文章。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">选择栏目</label>
          <TreeSelect
            className="w-full"
            treeData={options as DataNode[]}
            loading={loading}
            value={selectedKey || undefined}
            onChange={(val) => setSelectedKey((val as string) ?? "")}
            showSearch
            // 用 label 做过滤（label 都是可读文本）
            treeNodeFilterProp="label"
            filterTreeNode={(input, node) =>
              String(node.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            // ✅ 默认折叠；点标题即可展开/收起
            treeExpandedKeys={expandedKeys}
            onTreeExpand={(keys) => setExpandedKeys(keys as string[])}
            treeExpandAction="click"
            // 下拉不顶满，挂到触发元素父节点内，避免被 Dialog 裁剪
            popupMatchSelectWidth={false}
            listHeight={360}
            getPopupContainer={(trigger) =>
              trigger?.parentElement ?? document.body
            }
            placeholder="请选择（可搜索）"
            allowClear
            treeLine
          />
        </div>

        {selectedKey.endsWith(CREATE_SUBDIR_SUFFIX) && (
          <div className="space-y-1">
            <label className="text-sm font-medium">新建二级子栏目名称</label>
            <Input
              placeholder="e.g. foundation-models"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              将创建路径：{selectedKey.split("/")[0]} /{" "}
              {sanitizedSubdir || "<未填写>"}
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            文章标题（front-matter）
          </label>
          <Input
            placeholder="e.g. A Gentle Intro to Transformers"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
          />
          <label className="text-sm font-medium">文件名（必填）</label>
          <Input
            placeholder="e.g. intro-to-transformers"
            value={articleFile}
            onChange={(e) => {
              setArticleFile(e.target.value);
              if (!articleFileTouched) setArticleFileTouched(true);
            }}
            onBlur={() => setArticleFileTouched(true)}
          />
          {articleFileTouched && fileNameError && (
            <p className="text-xs text-destructive">{fileNameError}</p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            路径预览：
            <code className="font-mono">{finalDirPath || "(未选择)"}</code>
          </div>
          <Button onClick={handleOpenGithub} disabled={!canProceed}>
            继续在 GitHub 新建页面 <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
