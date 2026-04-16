"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/app/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export function PageFeedback() {
  const pathname = usePathname();
  const t = useTranslations("pageFeedback");
  const [voted, setVoted] = useState<"helpful" | "not_helpful" | null>(null);

  const handleVote = (vote: "helpful" | "not_helpful") => {
    if (voted) return;

    if (window.umami) {
      window.umami.track("feedback_submit", {
        page: pathname,
        vote,
      });
    }
    setVoted(vote);
  };

  if (voted) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500 mt-8 py-4 border-t border-[var(--foreground)] font-serif italic">
        <span>{t("thanks")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-t border-[var(--foreground)] mt-8">
      <span className="text-sm font-medium text-[var(--foreground)] font-serif">
        {t("question")}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVote("helpful")}
          className="gap-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors rounded-none font-sans"
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVote("not_helpful")}
          className="gap-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors rounded-none font-sans"
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </Button>
      </div>
    </div>
  );
}
