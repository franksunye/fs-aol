import type { ExecutionStatus } from "./execution-status";
import {
  type ExecutionAction,
  type ExecutionSummary,
} from "./action-execution-mock";
import { listActions, mapActionToExecution } from "./tracking/actions";
import { loadPilotHousekeepers } from "./pilot-housekeepers";
import { resolveExecutionAssigneeFromHk } from "./action-execution-mock";

export type ExecutionDataSource = "execution" | "fallback";

export type ExecutionMetricsResult = ExecutionSummary & {
  dataSource: ExecutionDataSource;
};

const EMPTY_SUMMARY: ExecutionSummary = {
  pendingDispatch: 0,
  pendingDispatchDelta: 0,
  dispatched: 0,
  dispatchedDelta: 0,
  inProgress: 0,
  inProgressDelta: 0,
  withFeedback: 0,
  withFeedbackDelta: 0,
  timeoutAnomaly: 0,
  timeoutAnomalyDelta: 0,
};

function summaryFromActions(actions: ExecutionAction[]): ExecutionSummary {
  const count = (s: ExecutionStatus) =>
    actions.filter((a) => a.status === s).length;
  return {
    pendingDispatch: count("pending_dispatch"),
    pendingDispatchDelta: 0,
    dispatched: count("dispatched"),
    dispatchedDelta: 0,
    inProgress: count("in_progress"),
    inProgressDelta: 0,
    withFeedback: actions.filter((a) => Boolean(a.terminalFeedback)).length,
    withFeedbackDelta: 0,
    timeoutAnomaly: count("timeout") + count("no_feedback"),
    timeoutAnomalyDelta: 0,
  };
}

export async function loadExecutionMetrics(
  hk?: string
): Promise<ExecutionMetricsResult> {
  try {
    const pilots = loadPilotHousekeepers();
    const assigneeId = resolveExecutionAssigneeFromHk(hk, pilots);
    const rows = await listActions({
      housekeeperId: hk,
      limit: 200,
    });
    const actions = await Promise.all(rows.map(mapActionToExecution));
    const scoped = assigneeId
      ? actions.filter((a) => a.assigneeId === assigneeId)
      : actions;
    if (scoped.length > 0) {
      return {
        ...summaryFromActions(scoped),
        dataSource: "execution",
      };
    }
    return { ...EMPTY_SUMMARY, dataSource: "execution" };
  } catch {
    return { ...EMPTY_SUMMARY, dataSource: "fallback" };
  }
}
