import type { ActionFlowStatus } from "./action-flow-status";
import { listSuggestions } from "./suggestions";
import {
  computeMyActionsSummary,
  getMyActionsMockData,
  resolveMyActionsAssigneeFromHk,
  type MyActionsSummary,
} from "./my-actions-mock";
import { loadPilotHousekeepers } from "./pilot-housekeepers";

export type ActionFlowDataSource = "actions" | "inbox" | "fallback";

export type ActionFlowSummaryResult = MyActionsSummary & {
  dataSource: ActionFlowDataSource;
};

const FALLBACK_SUMMARY: MyActionsSummary = {
  pendingDispatch: 5,
  pendingDispatchDelta: -1,
  dispatched: 18,
  dispatchedDelta: 3,
  inProgress: 7,
  inProgressDelta: 2,
  withFeedback: 16,
  withFeedbackDelta: 4,
  timeoutAnomaly: 3,
  timeoutAnomalyDelta: -1,
};

function hasLiveCounts(summary: MyActionsSummary): boolean {
  return (
    summary.pendingDispatch +
      summary.dispatched +
      summary.inProgress +
      summary.withFeedback +
      summary.timeoutAnomaly >
    0
  );
}

function summaryFromInboxProxy(activeCount: number): MyActionsSummary {
  const pending = Math.max(1, Math.round(activeCount * 0.35));
  const dispatched = Math.max(1, Math.round(activeCount * 0.25));
  const inProgress = Math.max(1, Math.round(activeCount * 0.15));
  const withFeedback = Math.max(1, Math.round(activeCount * 0.2));
  const timeoutAnomaly = Math.max(0, activeCount - pending - dispatched - inProgress - withFeedback);

  return {
    pendingDispatch: pending,
    pendingDispatchDelta: -1,
    dispatched,
    dispatchedDelta: 2,
    inProgress,
    inProgressDelta: 1,
    withFeedback,
    withFeedbackDelta: 3,
    timeoutAnomaly,
    timeoutAnomalyDelta: -1,
  };
}

export async function loadActionFlowSummary(
  hk?: string
): Promise<ActionFlowSummaryResult> {
  const pilots = loadPilotHousekeepers();
  const assigneeId = resolveMyActionsAssigneeFromHk(hk, pilots);
  const allActions = getMyActionsMockData();
  const scoped = assigneeId
    ? allActions.filter((a) => a.assigneeId === assigneeId)
    : allActions;

  const fromActions = computeMyActionsSummary(scoped);
  if (hasLiveCounts(fromActions)) {
    return { ...fromActions, dataSource: "actions" };
  }

  try {
    const activeRows = await listSuggestions({
      inboxBucket: "active",
      housekeeperId: hk,
      limit: 500,
    });
    if (activeRows.length > 0) {
      return {
        ...summaryFromInboxProxy(activeRows.length),
        dataSource: "inbox",
      };
    }
  } catch {
    // Turso 不可用时回退演示数据
  }

  return { ...FALLBACK_SUMMARY, dataSource: "fallback" };
}
