import { Suspense } from "react";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({
  children,
  activeCount,
  hk,
}: {
  children: React.ReactNode;
  activeCount: number;
  hk?: string;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <Suspense fallback={<div className="w-60 shrink-0 border-r" />}>
        <SidebarNav activeCount={activeCount} hk={hk} />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
