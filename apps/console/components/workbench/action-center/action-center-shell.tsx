import { Suspense } from "react";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import type { ActionCenterPrimaryKpi } from "@/lib/action-center-nav";
import type { InboxBucketCounts } from "@/lib/tracking/types";
import type { WorkbenchView } from "@/lib/workbench-tabs";
import { WorkbenchHeader } from "../workbench-header";
import { WorkbenchTabs } from "../workbench-tabs";
import { ActionCenterPrimaryKpis } from "./action-center-primary-kpis";

export function ActionCenterShell({
  pilots,
  hkFilter,
  workbenchView,
  tabCounts,
  actionsCount,
  primaryKpis,
  secondary,
  children,
}: {
  pilots: PilotHousekeeper[];
  hkFilter?: string;
  workbenchView: WorkbenchView;
  tabCounts: InboxBucketCounts;
  actionsCount: number;
  primaryKpis: ActionCenterPrimaryKpi[];
  secondary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-4 lg:px-4 lg:pt-5">
        <WorkbenchHeader pilots={pilots} hkFilter={hkFilter} compact />
        <ActionCenterPrimaryKpis kpis={primaryKpis} hk={hkFilter} />
        <Suspense fallback={null}>
          <WorkbenchTabs
            current={workbenchView}
            hk={hkFilter}
            counts={tabCounts}
            actionsCount={actionsCount}
          />
        </Suspense>
        {secondary}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </main>
  );
}
