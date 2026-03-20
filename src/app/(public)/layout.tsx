import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { publicNavItems } from "@/lib/navigation";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header items={publicNavItems} action={{ label: "Open Patient Portal", href: "/patient" }} />
      <main className="flex-1 pb-8">
        <PageContainer>
          <div className="rounded-[34px] border border-border bg-card p-5 shadow-[0_28px_46px_-36px_rgba(24,24,24,0.45)] sm:p-8">
            {children}
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
