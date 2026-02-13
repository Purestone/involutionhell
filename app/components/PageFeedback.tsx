"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export function PageFeedback() {
  const pathname = usePathname();
  const [voted, setVoted] = useState<"helpful" | "not_helpful" | null>(null);

  const handleVote = (vote: "helpful" | "not_helpful") => {
    if (voted) return;

    // Umami 埋点: 记录用户是否有帮助的投票
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 mt-8 py-4 border-t border-border">
        <span>Thanks for your feedback! / 感谢您的反馈！</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-t border-border mt-8">
      <span className="text-sm font-medium text-muted-foreground">
        Was this page helpful? / 这篇文章有帮助吗？
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote("helpful")}
          className="gap-2 hover:bg-green-500/10 hover:text-green-600"
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote("not_helpful")}
          className="gap-2 hover:bg-red-500/10 hover:text-red-600"
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </Button>
      </div>
    </div>
  );
}
