import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { DispatchNetwork } from "./components/DispatchNetwork";
import { Footer } from "./components/Footer";
import { FloatWindow } from "./components/float-window/FloatWindow";
import { fetchHomepageEvents } from "@/lib/events-fetch";

/**
 * 站点首页。现在是 async Server Component：在 SSR 时一并拉好活动数据，再传给
 * FloatWindow（client component）。Hero 内部的 ActivityTicker 是独立的 async 组件
 * 自己再 fetch 一次也没关系——Next Data Cache 会命中同一个 revalidate=300 条目，
 * 不会多打一次后端。
 */
export default async function DocsIndex() {
  const homepageEvents = await fetchHomepageEvents();
  // FloatWindow 只展示"第一条未过期活动"；fetchHomepageEvents 已把未过期排前面
  const latestActive = homepageEvents.find((e) => !e.deprecated) ?? null;

  return (
    <>
      <Header />
      <Hero />
      <DispatchNetwork />
      <Footer />
      <FloatWindow event={latestActive} />
    </>
  );
}
