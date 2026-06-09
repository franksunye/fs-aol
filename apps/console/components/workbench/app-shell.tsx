import { Suspense } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
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
    <div className="flex h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="hidden h-full w-60 shrink-0 border-r md:block" />}>
        <DesktopSidebar
          activeCount={activeCount}
          closedCount={closedCount}
          hk={hk}
        />
      </Suspense>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="bg-background z-30 flex shrink-0 items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <MobileSidebar
            activeCount={activeCount}
            closedCount={closedCount}
            hk={hk}
          />
          <span className="text-sm font-semibold">Follow-up Agent</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
