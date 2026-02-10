"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocsSearch } from "fumadocs-core/search/client";
import { useI18n } from "fumadocs-ui/provider";
import {
  SearchDialog,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogFooter,
  SearchDialogOverlay,
  SearchDialogIcon,
  SearchDialogClose,
  TagsList,
  TagsListItem,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";

interface SearchLink {
  name: string;
  href: string;
}

interface TagItem {
  name: string;
  value: string;
}

interface DefaultSearchDialogProps extends SharedProps {
  links?: [string, string][];
  type?: "fetch" | "static";
  defaultTag?: string;
  tags?: TagItem[];
  api?: string;
  delayMs?: number;
  footer?: React.ReactNode;
  allowClear?: boolean;
}

export function CustomSearchDialog({
  defaultTag,
  tags = [],
  api,
  delayMs,
  type = "fetch",
  allowClear = false,
  links = [],
  footer,
  ...props
}: DefaultSearchDialogProps) {
  const { locale } = useI18n();
  const [tag, setTag] = useState(defaultTag);
  const { search, setSearch, query } = useDocsSearch(
    type === "fetch"
      ? {
          type: "fetch",
          api,
          locale,
          tag,
          delayMs,
        }
      : {
          type: "static",
          from: api,
          locale,
          tag,
          delayMs,
        },
  );

  // Tracking logic
  useEffect(() => {
    if (!search) return;

    const timer = setTimeout(() => {
      if (window.umami) {
        window.umami.track("search_query", { query: search });
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [search]);

  const defaultItems = useMemo(() => {
    if (links.length === 0) return null;
    return links.map(([name, link]) => ({
      type: "page" as const,
      id: name,
      content: name,
      url: link,
    }));
  }, [links]);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={
            query.data !== "empty" && query.data ? query.data : defaultItems
          }
        />
      </SearchDialogContent>
      <SearchDialogFooter>
        {tags.length > 0 && (
          <TagsList tag={tag} onTagChange={setTag} allowClear={allowClear}>
            {tags.map((tag) => (
              <TagsListItem key={tag.value} value={tag.value}>
                {tag.name}
              </TagsListItem>
            ))}
          </TagsList>
        )}
        {footer}
      </SearchDialogFooter>
    </SearchDialog>
  );
}
