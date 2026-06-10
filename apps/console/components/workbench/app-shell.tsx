import { Suspense } from "react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { SidebarBrand } from "./sidebar-brand";
import { ShellTopBar } from "./shell-top-bar";

export function AppShell({
  children,
  activeCount,
  closedCount,
  hk,
  sidebarCollapsed = false,
}: {
  children: React.ReactNode;
  activeCount: number;
  closedCount?: number;
  hk?: string;
  sidebarCollapsed?: boolean;
}) {
  return (
    <TooltipProvider delay={400}>
      <div className="flex h-dvh w-full overflow-hidden">
        <Suspense
          fallback={
            <div
              className="bg-sidebar hidden h-full shrink-0 border-r border-sidebar-border md:block"
              style={{ width: sidebarCollapsed ? "4.25rem" : "15rem" }}
              aria-hidden
            />
          }
        >
          <DesktopSidebar
            activeCount={activeCount}
            closedCount={closedCount}
            hk={hk}
            initialCollapsed={sidebarCollapsed}
          />
        </Suspense>
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="bg-background z-30 flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
            <MobileSidebar
              activeCount={activeCount}
              closedCount={closedCount}
              hk={hk}
            />
            <SidebarBrand compact />
          </div>
          <ShellTopBar />
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </TooltipProvider>
  );
}
