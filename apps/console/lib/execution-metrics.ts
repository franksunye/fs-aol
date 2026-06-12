import type { ExecutionStatus } from "./execution-status";
import { type ExecutionSummary } from "./action-execution-mock";
import {
  summarizeActionFlow,
  type ActionFlowSummary,
} from "./tracking/action-flow-summary";

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

export function executionMetricsFromFlow(
  flow: ActionFlowSummary
): ExecutionMetricsResult {
  const total =
    flow.pendingDispatch +
    flow.dispatched +
    flow.inProgress +
    flow.withFeedback +
    flow.timeoutAnomaly;
  if (total > 0) {
    return {
      ...flowToSummary(flow),
      dataSource: "execution",
    };
  }
  return { ...EMPTY_SUMMARY, dataSource: "execution" };
}

function flowToSummary(flow: ActionFlowSummary): ExecutionSummary {
  return {
    pendingDispatch: flow.pendingDispatch,
    pendingDispatchDelta: 0,
    dispatched: flow.dispatched,
    dispatchedDelta: 0,
    inProgress: flow.inProgress,
    inProgressDelta: 0,
    withFeedback: flow.withFeedback,
    withFeedbackDelta: 0,
    timeoutAnomaly: flow.timeoutAnomaly,
    timeoutAnomalyDelta: 0,
  };
}

export async function loadExecutionMetrics(
  hk?: string
): Promise<ExecutionMetricsResult> {
  try {
    return executionMetricsFromFlow(await summarizeActionFlow(hk));
  } catch {
    return { ...EMPTY_SUMMARY, dataSource: "fallback" };
  }
}
