"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";

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
  const t = useTranslations("editorMetadata");

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

  const handleTagsChange = (value: string) => {
    setTagsInputValue(value);
    const processedTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setSkipNextSync(true);
    setTags(processedTags);
  };

  const handleTagsBlur = () => {
    const filteredTags = tags.filter((tag) => tag.length > 0);
    setSkipNextSync(true);
    setTags(filteredTags);
    setTagsInputValue(filteredTags.join(", "));
  };

  const handleFilenameBlur = () => {
    if (filename && !filename.endsWith(".md")) {
      setFilename(filename + ".md");
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{t("heading")}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 标题 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">
            {t("title.label")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder={t("title.placeholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={cn(!title && "aria-invalid:border-destructive")}
          />
        </div>

        {/* 描述 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">{t("description.label")}</Label>
          <Input
            id="description"
            placeholder={t("description.placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 标签 */}
        <div className="space-y-2">
          <Label htmlFor="tags">
            {t("tags.label")}{" "}
            <span className="text-muted-foreground text-xs">
              ({t("tags.hint")})
            </span>
          </Label>
          <Input
            id="tags"
            placeholder={t("tags.placeholder")}
            value={tagsInputValue}
            onChange={(e) => handleTagsChange(e.target.value)}
            onBlur={handleTagsBlur}
          />
        </div>

        {/* 文件名 */}
        <div className="space-y-2">
          <Label htmlFor="filename">
            {t("filename.label")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="filename"
            placeholder={t("filename.placeholder")}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onBlur={handleFilenameBlur}
            required
            className={cn(!filename && "aria-invalid:border-destructive")}
          />
          <p className="text-xs text-muted-foreground">{t("filename.hint")}</p>
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
