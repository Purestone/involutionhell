import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { AnimatedBar } from "@/app/components/AnimatedBar";
import { cn } from "@/lib/utils";

import leaderboardData from "@/generated/site-leaderboard.json";

// We use the generated JSON
const mockRanks = leaderboardData as {
  id: string;
  name: string;
  points: number;
  commits: number;
  avatarUrl: string;
}[];

export default function RankPage() {
  const maxPoints = mockRanks[0].points;

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
              <div
                key={user.id}
                className="group flex flex-col md:flex-row md:items-center gap-4 border border-[var(--foreground)] p-4 bg-[var(--background)] hard-shadow-hover transition-all"
              >
                <div className="font-mono text-2xl font-bold w-12 text-center text-[var(--foreground)]">
                  #{idx + 1}
                </div>
                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 border border-[var(--foreground)] transition-transform group-hover:scale-110 overflow-hidden">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <div className="font-serif text-xl font-bold text-[var(--foreground)]">
                    {user.name}
                  </div>
                  <div className="font-mono text-xs uppercase text-neutral-500 mt-1">
                    {user.points.toLocaleString()} PTS
                  </div>
                </div>

                {/* Bar chart visualization */}
                <div className="w-full md:w-64 lg:w-96 h-6 border border-[var(--foreground)] bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-[var(--foreground)] transition-all duration-1000 origin-left"
                    style={{ width: `${(user.points / maxPoints) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 font-mono text-[10px] text-[var(--background)] mix-blend-difference">
                    POWER LEVEL
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
