import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { PageContainer } from "@/components/layout/page-container";
import { adminSidebarNav } from "@/lib/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header action={{ label: "Public Website", href: "/" }} />
      <PageContainer className="pb-8">
        <div className="flex w-full gap-6 rounded-[34px] border border-border bg-card p-4 shadow-[0_30px_48px_-38px_rgba(24,24,24,0.42)] md:p-6">
          <Sidebar
            title="Staff & Admin Dashboard"
            description="Review uploaded prescription and insurance records, manage medicine plans, facilities, doctors, reminders, and operational queues."
            items={adminSidebarNav}
          />
          <main className="min-w-0 flex-1 space-y-4">{children}</main>
        </div>
      </PageContainer>
    </div>
  );
}
