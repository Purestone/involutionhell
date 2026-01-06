import React from "react";
import { Users, Zap, Heart } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";

export function Features() {
  const features = [
    {
      icon: <GithubIcon className="h-8 w-8 text-sky-500" />,
      title: "完全开源",
      description:
        "所有内容存放于 GitHub 仓库，任何人都能参与贡献。代码透明，社区驱动。",
      highlight: "100% 透明",
      color: "bg-red-100",
    },
    {
      icon: <Heart className="h-8 w-8 text-sky-500" />,
      title: "开放透明",
      description:
        "没有门槛、没有收费，所有资料和代码都对外公开。真正的开放式学习环境。",
      highlight: "免费开放",
      color: "bg-red-200",
    },
    {
      icon: <Users className="h-8 w-8 text-sky-500" />,
      title: "社区驱动",
      description:
        "每一位贡献者都是组织的建设者。共同打造属于开发者的学习天堂。",
      highlight: "共同建设",
      color: "bg-red-100",
    },
    {
      icon: <Zap className="h-8 w-8 text-sky-500" />,
      title: "高效学习",
      description:
        "精心整理的技术文档，避免重复造轮子。专注于提升实际技能而非内卷竞争。",
      highlight: "效率优先",
      color: "bg-red-200",
    },
  ];

  return (
    <section id="features" className="py-24 border-t border-[#111111]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12 items-end mb-16 pb-8 border-b-4 border-[#111111]">
          <h2 className="text-6xl md:text-8xl font-serif font-black italic uppercase leading-none tracking-tighter">
            Mission <br /> Statement
          </h2>
          <p className="text-xl font-body text-neutral-600 max-w-2xl text-justify mb-2">
            我们致力于创造一个真正属于开发者的学习环境，让每个人都能在这里获得成长。在这里，知识是流动的，门槛是不存在的，而内卷是被鄙视的。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-[#111111]">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative border-r border-b border-[#111111] p-12 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 border border-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-all duration-300">
                    {/* Simplified icon styling */}
                    <div className="p-0 text-[#111111] group-hover:text-white">
                      {React.cloneElement(feature.icon as React.ReactElement, {
                        className: "h-8 w-8",
                      })}
                    </div>
                  </div>
                  <div className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    SEC. 0{index + 1}
                  </div>
                </div>

                <div className="flex items-baseline gap-4 mb-4">
                  <h3 className="text-3xl font-serif font-bold italic">
                    {feature.title}
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#CC0000] font-bold">
                    {feature.highlight}
                  </span>
                </div>

                <p className="font-body text-neutral-600 leading-relaxed text-justify">
                  {feature.description}
                </p>

                <div className="mt-8 pt-6 border-t border-dashed border-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#111111]">
                    Learn More &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
