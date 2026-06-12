import { cookies } from "next/headers";
import { countInboxBuckets } from "@/lib/suggestions";
import { loadOverviewSidebarBadge } from "@/lib/overview";
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
  const [counts, overviewBadge] = await Promise.all([
    countInboxBuckets(hk || undefined),
    loadOverviewSidebarBadge(hk || undefined),
  ]);

  return (
    <AppShell
      activeCount={counts.active}
      overviewBadge={overviewBadge}
      closedCount={counts.closed}
      hk={hk || undefined}
      sidebarCollapsed={sidebarCollapsed}
    >
      {children}
    </AppShell>
  );
}
