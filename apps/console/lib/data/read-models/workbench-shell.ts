import { cache } from "react";
import { countInboxBuckets } from "@/lib/tracking/inbox";
import { countPendingActions } from "@/lib/tracking/actions";
import {
  summarizeActionFlow,
  type ActionFlowSummary,
} from "@/lib/tracking/action-flow-summary";
import type { InboxBucketCounts } from "@/lib/tracking/types";

export type WorkbenchShellSnapshot = {
  buckets: InboxBucketCounts;
  pendingExecution: number;
  flow: ActionFlowSummary;
};

async function loadWorkbenchShellSnapshotUncached(
  housekeeperId?: string
): Promise<WorkbenchShellSnapshot> {
  const [buckets, pendingExecution, flow] = await Promise.all([
    countInboxBuckets(housekeeperId),
    countPendingActions(housekeeperId),
    summarizeActionFlow(housekeeperId),
  ]);
  return {
    buckets,
    pendingExecution,
    flow,
  };
}

/** 工作台壳层（layout）单次请求内去重。 */
export const loadWorkbenchShellSnapshot = cache(
  loadWorkbenchShellSnapshotUncached
);
