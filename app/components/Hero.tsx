import Link from "next/link";
import ZoteroFeedLazy from "@/app/components/ZoteroFeedLazy";
import { Contribute } from "@/app/components/Contribute";
import Image from "next/image";
import { ActivityTicker } from "@/app/components/ActivityTicker";
import { cn } from "@/lib/utils";

export function Hero() {
  const categories: { title: string; desc: string; href: string }[] = [
    {
      title: "AI",
      desc: "基础数学、LLM、训练与推理、评测、数据集等",
      href: "/docs/ai",
    },
    {
      title: "Computer Science",
      desc: "数据结构、算法与基础计算机科学知识",
      href: "/docs/computer-science",
    },
    {
      title: "笔试面经",
      desc: "可以给我一份工作吗？我什么都可以做！",
      href: "/docs/jobs/interview-prep/bq",
    },
    {
      title: "群友分享",
      desc: "群友写的捏",
      href: "/docs/CommunityShare",
    },
  ];

  return (
    <section className="relative pt-32 pb-16 newsprint-texture">
      <div className="container relative mx-auto px-6">
        {/* Ticker - mimicking stock ticker */}
        <div className="border-y border-[#111111] py-2 mb-12 overflow-hidden bg-neutral-100 flex items-center">
          <div className="font-mono text-xs uppercase tracking-widest px-4 border-r border-[#111111] whitespace-nowrap">
            Breaking News
          </div>
          <div className="flex-1">
            <ActivityTicker />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 border-r border-[#111111] pr-8 min-h-[400px]">
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-serif font-black leading-[0.85] tracking-tighter mb-8 uppercase italic">
              Involution <br /> Hell
            </h1>

            <div className="max-w-2xl">
              <p className="text-xl md:text-2xl font-body leading-relaxed text-justify drop-cap">
                一个由开发者自发组织、免费开放的学习社区。降低门槛，避免无意义内卷，专注真实进步与乐趣。我们相信知识不应成为枷锁，而应是通往自由的阶梯。
              </p>

              <div className="mt-12">
                <Contribute />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="border border-[#111111] p-1 grayscale hover:grayscale-0 transition-all duration-500">
              <Image
                src="/mascot.webp"
                alt="Mascot"
                width={420}
                height={400}
                priority
                className="w-full h-auto object-contain bg-neutral-200"
              />
              <div className="font-mono text-[10px] uppercase p-2 border-t border-[#111111] text-neutral-500">
                Fig. 1.1 — The Spirit of Resilience
              </div>
            </div>

            <div className="border border-[#111111] p-6 bg-[#111111] text-[#F9F9F7]">
              <h3 className="font-serif text-2xl mb-4">Join the Resistance</h3>
              <p className="font-body text-sm mb-6 opacity-80">
                Connect with thousands of developers who are reclaiming their
                passion for technology.
              </p>
              <button className="w-full py-3 border border-[#F9F9F7] font-sans text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all">
                Access Archives
              </button>
            </div>
          </div>
        </div>

        {/* Top-level directories - Grid with shared borders */}
        <div className="mt-16 border-t-4 border-[#111111]">
          <div className="py-4 font-mono text-xs uppercase tracking-widest border-b border-[#111111]">
            Classified Archives / 归档分类
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, idx) => (
              <li
                key={c.title}
                className={cn(
                  "group border-b border-[#111111] md:border-r last:border-r-0 h-full",
                  idx % 2 === 1 && "md:border-r-0 lg:border-r",
                  idx === 3 && "lg:border-r-0",
                )}
              >
                <Link
                  href={c.href}
                  className="p-8 hover:bg-neutral-100 transition-colors h-full flex flex-col hard-shadow-hover"
                >
                  <div className="font-mono text-[10px] text-neutral-400 mb-4">
                    00{idx + 1}
                  </div>
                  <div className="text-2xl font-serif font-bold mb-2 uppercase">
                    {c.title}
                  </div>
                  <p className="text-sm font-body text-neutral-600 flex-1 leading-relaxed">
                    {c.desc}
                  </p>
                  <div className="mt-6 font-sans text-[10px] uppercase tracking-widest font-bold group-hover:text-[#CC0000]">
                    Read More &rarr;
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <ZoteroFeedLazy groupId={6053219} limit={8} />
        </div>
      </div>
    </section>
  );
}
