"use client";

import { useState } from "react";

import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * 编辑器元数据表单组件
 * 用于输入文章的标题、描述、标签和文件名
 */
export function EditorMetadataForm() {
  const {
    title,
    description,
    tags,
    filename,
    setTitle,
    setDescription,
    setTags,
    setFilename,
  } = useEditorStore();

  const [tagsInputValue, setTagsInputValue] = useState(() => tags.join(", "));
  const [skipNextSync, setSkipNextSync] = useState(false);
  const [prevTags, setPrevTags] = useState(tags);

  if (tags !== prevTags) {
    setPrevTags(tags);
    if (skipNextSync) {
      setSkipNextSync(false);
    } else {
      setTagsInputValue(tags.join(", "));
    }
  }

  // 处理标签输入（逗号分隔）
  const handleTagsChange = (value: string) => {
    setTagsInputValue(value);
    const processedTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setSkipNextSync(true);
    setTags(processedTags);
  };

  // 处理标签输入框失去焦点 - 过滤所有空标签并同步展示值
  const handleTagsBlur = () => {
    const filteredTags = tags.filter((tag) => tag.length > 0);
    setSkipNextSync(true);
    setTags(filteredTags);
    setTagsInputValue(filteredTags.join(", "));
  };

  // 自动添加 .md 后缀
  const handleFilenameBlur = () => {
    if (filename && !filename.endsWith(".md")) {
      setFilename(filename + ".md");
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">文章信息</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 标题 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">
            标题 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="输入文章标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={cn(!title && "aria-invalid:border-destructive")}
          />
        </div>

        {/* 描述 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            placeholder="简短描述文章内容..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 标签 */}
        <div className="space-y-2">
          <Label htmlFor="tags">
            标签{" "}
            <span className="text-muted-foreground text-xs">(逗号分隔)</span>
          </Label>
          <Input
            id="tags"
            placeholder="算法, 系统设计, React"
            value={tagsInputValue}
            onChange={(e) => handleTagsChange(e.target.value)}
            onBlur={handleTagsBlur}
          />
        </div>

        {/* 文件名 */}
        <div className="space-y-2">
          <Label htmlFor="filename">
            文件名 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="filename"
            placeholder="my-article"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onBlur={handleFilenameBlur}
            required
            className={cn(!filename && "aria-invalid:border-destructive")}
          />
          <p className="text-xs text-muted-foreground">自动添加 .md 后缀</p>
        </div>
      </div>

      {/* 预览标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
