import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { AnimatedBar } from "@/app/components/AnimatedBar";
import { cn } from "@/lib/utils";
import { ContributorRow } from "@/app/components/ContributorRow";

import leaderboardData from "@/generated/site-leaderboard.json";

// We use the generated JSON
const rawRanks = leaderboardData as {
  id: string;
  name: string;
  points: number;
  commits: number;
  avatarUrl: string;
  contributedDocs?: { id: string; title: string; url: string }[];
}[];

// 维护一个容器（数组），填写需要从排行榜中屏蔽的维护者或用户的名称
const MAINTAINERS = ["longsizhuo", "Mira190"];

const mockRanks = rawRanks.filter((user) => !MAINTAINERS.includes(user.name));

export default function RankPage() {
  const maxPoints = mockRanks.length > 0 ? mockRanks[0].points : 100;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 pb-16 newsprint-texture">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-12 border-b-4 border-[var(--foreground)] pb-4">
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase text-[var(--foreground)]">
              Leaderboard
            </h1>
            <p className="font-mono text-sm uppercase tracking-widest mt-4 text-neutral-500">
              The Hall of Fame — Top Contributors
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {mockRanks.map((user, idx) => (
              <ContributorRow
                key={user.id}
                user={user}
                idx={idx}
                maxPoints={maxPoints}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
