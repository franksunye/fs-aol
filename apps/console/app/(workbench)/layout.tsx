import { cookies } from "next/headers";
import { loadWorkbenchShellSnapshot } from "@/lib/data";
import { AppShell } from "@/components/action-center/app-shell";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import {
  isSidebarCollapsed,
  SIDEBAR_COLLAPSED_COOKIE,
} from "@/lib/shell-preferences";

export default async function ActionCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hk = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const sidebarCollapsed = isSidebarCollapsed(
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value
  );
  const shell = await loadWorkbenchShellSnapshot(hk || undefined);

  return (
    <AppShell
      activeCount={shell.buckets.active}
      overviewBadge={shell.overviewBadge}
      closedCount={shell.buckets.closed}
      hk={hk || undefined}
      sidebarCollapsed={sidebarCollapsed}
    >
      {children}
    </AppShell>
  );
}
