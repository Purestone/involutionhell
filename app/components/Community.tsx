import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
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
      className="py-24 border-t border-[#111111] newsprint-texture"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-baseline mb-16 pb-4 border-b border-[#111111]">
          <h2 className="text-6xl md:text-8xl font-serif font-black uppercase italic tracking-tighter">
            Community <br /> Archives
          </h2>
          <div className="font-mono text-xs uppercase tracking-widest text-neutral-500 max-w-sm text-right">
            Join thousands of researchers and developers in our distributed
            network.
          </div>
        </div>

        {/* Main CTA Section - Inverted */}
        <div className="mb-16 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] p-12 lg:p-24 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-block border border-[#F9F9F7] p-4 mb-8">
              <BookOpen className="h-12 w-12 text-[#F9F9F7]" />
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
              className="bg-transparent border-[#F9F9F7] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] px-12 py-8 h-auto font-sans text-sm uppercase tracking-widest font-bold"
            >
              <a href="docs/ai" target="_blank" rel="noopener noreferrer">
                Access Archives <ExternalLink className="ml-4 h-5 w-5" />
              </a>
            </Button>
          </div>
          {/* Halftone background effect */}
          <div className="absolute inset-0 halftone pointer-events-none opacity-20" />
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#111111]">
          <div className="border-r border-b border-[#111111] p-12 hover:bg-neutral-100 transition-colors group">
            <div className="mb-8 w-12 h-12 border border-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-all">
              <Github className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold italic mb-4">
              GitHub 仓库
            </h3>
            <p className="font-body text-neutral-600 mb-8 leading-relaxed">
              查看源代码，提交 Issue，参与项目讨论。每一个 Commit
              都是对社区的贡献。
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-[#111111] hover:bg-[#111111] hover:text-white font-sans text-[10px] uppercase tracking-widest font-bold"
            >
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source Code <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="border-r border-b border-[#111111] p-12 hover:bg-neutral-100 transition-colors group">
            <div className="mb-8 w-12 h-12 border border-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-all">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold italic mb-4">
              Discord 社区
            </h3>
            <p className="font-body text-neutral-600 mb-8 leading-relaxed">
              实时交流，分享经验，结识志同道合的朋友。打破孤岛，共同成长。
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-[#111111] hover:bg-[#111111] hover:text-white font-sans text-[10px] uppercase tracking-widest font-bold"
            >
              <a
                href="https://discord.com/invite/6CGP73ZWbD"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Dispatch <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="border-r border-b border-[#111111] p-12 hover:bg-neutral-100 transition-colors group">
            <div className="mb-8 w-12 h-12 border border-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-all">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold italic mb-4">
              文献资料
            </h3>
            <p className="font-body text-neutral-600 mb-8 leading-relaxed">
              访问我们在 Zotero 的文献库，获取精选学术资源。连接前沿科技。
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-[#111111] hover:bg-[#111111] hover:text-white font-sans text-[10px] uppercase tracking-widest font-bold"
            >
              <a
                href="https://www.zotero.org/groups/6053219/unsw_ai/library"
                target="_blank"
                rel="noopener noreferrer"
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
