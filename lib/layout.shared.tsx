import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { AuthNav } from "@/app/components/AuthNav";

export async function baseOptions(): Promise<BaseLayoutProps> {
  return {
    nav: {
      title: "内卷地狱",
      children: (
        <div className="ms-auto flex items-center gap-2 pr-3">
          <AuthNav />
        </div>
      ),
    },
  };
}
