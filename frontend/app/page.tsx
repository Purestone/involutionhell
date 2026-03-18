import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Community } from "./components/Community";
import { Footer } from "./components/Footer";
import { FloatWindow } from "./components/float-window/FloatWindow";

export default function DocsIndex() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Community />
      <Footer />
      <FloatWindow />
    </>
  );
}
