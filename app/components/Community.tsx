import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MessageCircle,
  Github,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export function Community() {
  return (
    <section
      id="community"
      className="py-24 border-t border-[var(--foreground)] newsprint-texture transition-colors duration-300"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-baseline mb-16 pb-4 border-b border-[var(--foreground)] transition-colors duration-300">
          <h2 className="text-6xl md:text-8xl font-serif font-black uppercase italic tracking-tighter text-[var(--foreground)]">
            Community <br /> Archives
          </h2>
          <div className="font-mono text-xs uppercase tracking-widest text-neutral-500 max-w-sm text-right">
            Join thousands of researchers and developers in our distributed
            network.
          </div>
        </div>

        {/* Main CTA Section */}
        <div className="mb-16 border-4 border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] p-12 lg:p-24 relative overflow-hidden transition-colors duration-300">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-block border border-[var(--foreground)] p-4 mb-8">
              <BookOpen className="h-12 w-12 text-[var(--foreground)]" />
            </div>
            <h3 className="text-4xl md:text-6xl font-serif font-bold italic mb-6">
              内卷知识库
            </h3>
            <p className="font-body text-xl mb-12 opacity-80 leading-relaxed text-justify md:text-center">
              探索我们精心整理的技术文档、教程和工具。从基础到进阶，应有尽有。我们不仅是在分享知识，更是在构建共识。
            </p>
            <Button
              variant="outline"
              asChild
              className="bg-transparent border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] px-12 py-8 h-auto font-sans text-sm uppercase tracking-widest font-bold"
            >
              <a
                href="docs/ai"
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="feature_cta_click"
                data-umami-event-action="access_articles"
                data-umami-event-location="community_section"
              >
                Access Articles / 访问文章{" "}
                <ExternalLink className="ml-4 h-5 w-5" />
              </a>
            </Button>
          </div>
          {/* Halftone background effect */}
          <div className="absolute inset-0 halftone pointer-events-none opacity-20" />
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[var(--foreground)] transition-colors duration-300">
          <div className="border-r border-b border-[var(--foreground)] p-12 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors group">
            <div className="mb-8 w-12 h-12 border border-[var(--foreground)] flex items-center justify-center group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] transition-all">
              <Github className="h-6 w-6 text-[var(--foreground)] group-hover:text-[var(--background)]" />
            </div>
            <h3 className="text-2xl font-serif font-bold italic mb-4 text-[var(--foreground)]">
              GitHub 仓库
            </h3>
            <p className="font-body text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              查看源代码，提交 Issue，参与项目讨论。每一个 Commit
              都是对社区的贡献。
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] font-sans text-[10px] uppercase tracking-widest font-bold"
            >
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="social_click"
                data-umami-event-platform="github"
                data-umami-event-location="community_card"
              >
                Source Code <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="border-r border-b border-[var(--foreground)] p-12 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors group">
            <div className="mb-8 w-12 h-12 border border-[var(--foreground)] flex items-center justify-center group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] transition-all">
              <MessageCircle className="h-6 w-6 text-[var(--foreground)] group-hover:text-[var(--background)]" />
            </div>
            <h3 className="text-2xl font-serif font-bold italic mb-4 text-[var(--foreground)]">
              Discord 社区
            </h3>
            <p className="font-body text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              实时交流，分享经验，结识志同道合的朋友。打破孤岛，共同成长。
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] font-sans text-[10px] uppercase tracking-widest font-bold"
            >
              <a
                href="https://discord.com/invite/6CGP73ZWbD"
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="social_click"
                data-umami-event-platform="discord"
                data-umami-event-location="community_card"
              >
                Join Dispatch <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="border-r border-b border-[var(--foreground)] p-12 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors group">
            <div className="mb-8 w-12 h-12 border border-[var(--foreground)] flex items-center justify-center group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] transition-all">
              <GraduationCap className="h-6 w-6 text-[var(--foreground)] group-hover:text-[var(--background)]" />
            </div>
            <h3 className="text-2xl font-serif font-bold italic mb-4 text-[var(--foreground)]">
              文献资料
            </h3>
            <p className="font-body text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              访问我们在 Zotero 的文献库，获取精选学术资源。连接前沿科技。
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] font-sans text-[10px] uppercase tracking-widest font-bold"
            >
              <a
                href="https://www.zotero.org/groups/6053219/unsw_ai/library"
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="resource_click"
                data-umami-event-type="zotero"
                data-umami-event-location="community_card"
              >
                View Library <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
