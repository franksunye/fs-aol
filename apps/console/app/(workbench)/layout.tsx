import { cookies } from "next/headers";
import { countInboxBuckets } from "@/lib/suggestions";
import { AppShell } from "@/components/workbench/app-shell";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import {
  isSidebarCollapsed,
  SIDEBAR_COLLAPSED_COOKIE,
} from "@/lib/shell-preferences";

export default async function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hk = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const sidebarCollapsed = isSidebarCollapsed(
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value
  );
  const counts = await countInboxBuckets(
    hk ? { housekeeperId: hk } : {}
  );

  return (
    <AppShell
      activeCount={counts.active}
      closedCount={counts.closed}
      hk={hk || undefined}
      sidebarCollapsed={sidebarCollapsed}
    >
      {children}
    </AppShell>
  );
}
