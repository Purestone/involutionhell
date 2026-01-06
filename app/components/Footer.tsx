import Link from "next/link";
import { Github, MessageCircle, ExternalLink } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { LicenseNotice } from "./LicenseNotice";

export function Footer() {
  return (
    <footer
      id="contact"
      className="border-t-4 border-[#111111] bg-[#F9F9F7] newsprint-texture"
    >
      <div className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5 border-r border-[#111111] pr-12">
            <BrandMark
              className="mb-6 gap-3"
              textClassName="font-serif font-black text-2xl uppercase italic"
            />
            <p className="font-body text-neutral-600 mb-8 max-w-md text-justify leading-relaxed">
              一个由开发者自发组织的、完全免费且开放的学习社区。我们相信通过集体协作与开放共享，可以打破技术垄断，创造一个更公平的学习环境。
            </p>
            <div className="flex space-x-2">
              <a
                href="https://github.com/involutionhell"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-[#111111] hover:bg-[#111111] hover:text-white transition-all"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://discord.com/invite/6CGP73ZWbD"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-[#111111] hover:bg-[#111111] hover:text-white transition-all"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 border-b border-[#111111] pb-2">
                Archives
              </h3>
              <ul className="space-y-3 font-body text-sm">
                <li>
                  <Link
                    href="/docs/ai"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    AI & Mathematics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/computer-science"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Computer Science
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/CommunityShare"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Community Sharing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/jobs"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Career Prep
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 border-b border-[#111111] pb-2">
                Resources
              </h3>
              <ul className="space-y-3 font-body text-sm">
                <li>
                  <a
                    href="https://www.zotero.org/groups/6053219/unsw_ai/library"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Zotero Library
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Mission Brief
                  </a>
                </li>
                <li>
                  <a
                    href="#community"
                    className="hover:text-[#CC0000] transition-colors"
                  >
                    Network Status
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 border-b border-[#111111] pb-2">
                Legal
              </h3>
              <div className="font-body text-xs text-neutral-500 leading-relaxed">
                <p className="mb-4">Edition: Vol 1.0.0</p>
                <p className="mb-4">Printed in the Cloud</p>
                <LicenseNotice />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-[#111111] flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          <div>
            &copy; {new Date().getFullYear()} Involution Hell Organization
          </div>
          <div className="flex gap-8">
            <span>Open Source</span>
            <span>Free Forever</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
