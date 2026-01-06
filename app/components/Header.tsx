import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../../components/ui/button";
import { MessageCircle } from "lucide-react";
import { Github as GithubIcon } from "./icons/Github";
import { SignInButton } from "./SignInButton";
import { auth } from "@/auth";
import { UserMenu } from "./UserMenu";
import { BrandMark } from "./BrandMark";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const provider =
    session && "provider" in session
      ? (session.provider as string | undefined)
      : undefined;
  console.log("session", session);
  return (
    <header className="fixed top-0 w-full z-50 bg-[#F9F9F7] border-b border-[#111111] py-2">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between border-b border-[#111111] pb-2 mb-2">
          <div className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Vol. 1 | No. 128 | Beijing Edition
          </div>
          <BrandMark priority />
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="flex items-center justify-between h-10">
          <nav className="hidden md:flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-widest">
            <a
              href="#features"
              className="hover:text-[#CC0000] transition-colors"
            >
              特点
            </a>
            <a
              href="#community"
              className="hover:text-[#CC0000] transition-colors"
            >
              社区
            </a>
            <a
              href="#contact"
              className="hover:text-[#CC0000] transition-colors"
            >
              联系我们
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-none border border-transparent hover:border-[#111111] hover:bg-white"
            >
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-none border border-transparent hover:border-[#111111] hover:bg-white"
            >
              <a
                href="https://discord.com/invite/6CGP73ZWbD"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
            {user ? (
              <UserMenu user={user} provider={provider} />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
