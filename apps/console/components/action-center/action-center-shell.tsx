import { Suspense } from "react";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import type { ActionCenterPrimaryKpi } from "@/lib/action-center-kpi";
import type { InboxBucketCounts } from "@/lib/tracking/types";
import type { ActionCenterView } from "@/lib/action-center-tabs";
import { ActionCenterHeader } from "./action-center-header";
import { ActionCenterTabs } from "./action-center-tabs";
import { ActionCenterPrimaryKpis } from "./action-center-primary-kpis";

export function ActionCenterShell({
  pilots,
  hkFilter,
  actionCenterView,
  tabCounts,
  executionCount,
  primaryKpis,
  secondary,
  children,
}: {
  pilots: PilotHousekeeper[];
  hkFilter?: string;
  actionCenterView: ActionCenterView;
  tabCounts: InboxBucketCounts;
  executionCount: number;
  primaryKpis: ActionCenterPrimaryKpi[];
  secondary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-4 lg:px-4 lg:pt-5">
        <ActionCenterHeader pilots={pilots} hkFilter={hkFilter} compact />
        <ActionCenterPrimaryKpis kpis={primaryKpis} hk={hkFilter} />
        <Suspense fallback={null}>
          <ActionCenterTabs
            current={actionCenterView}
            hk={hkFilter}
            counts={tabCounts}
            executionCount={executionCount}
          />
        </Suspense>
        {secondary}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </main>
  );
}
