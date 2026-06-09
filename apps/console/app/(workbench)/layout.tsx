import { cookies } from "next/headers";
import { countInboxBuckets } from "@/lib/suggestions";
import { AppShell } from "@/components/workbench/app-shell";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";

export default async function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hk = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const counts = await countInboxBuckets(
    hk ? { housekeeperId: hk } : {}
  );

  return (
    <AppShell
      activeCount={counts.active}
      closedCount={counts.closed}
      hk={hk || undefined}
    >
      {children}
    </AppShell>
  );
}
