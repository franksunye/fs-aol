import { Suspense } from "react";
import { SidebarNav } from "./sidebar-nav";
import { MobileSidebar } from "./mobile-sidebar";

export function AppShell({
  children,
  activeCount,
  closedCount,
  hk,
}: {
  children: React.ReactNode;
  activeCount: number;
  closedCount?: number;
  hk?: string;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <Suspense fallback={<div className="hidden w-60 shrink-0 border-r md:block" />}>
        <aside className="hidden h-screen shrink-0 md:block">
          <SidebarNav
            activeCount={activeCount}
            closedCount={closedCount}
            hk={hk}
          />
        </aside>
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="bg-background sticky top-0 z-30 flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <MobileSidebar
            activeCount={activeCount}
            closedCount={closedCount}
            hk={hk}
          />
          <span className="text-sm font-semibold">Follow-up Agent</span>
        </div>
        {children}
      </div>
    </div>
  );
}
