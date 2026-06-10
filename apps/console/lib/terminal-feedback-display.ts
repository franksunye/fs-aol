import type { ExecutionAction } from "./action-execution-mock";

export type TerminalFeedbackDisplayState = "no_feedback" | "viewed";

const EMPTY_FEEDBACK = new Set(["", "终端尚未回写", "终端尚未回写反馈"]);

export function terminalFeedbackDisplayState(
  action: Pick<ExecutionAction, "terminalFeedback" | "status">
): TerminalFeedbackDisplayState {
  const text = action.terminalFeedback?.trim() ?? "";
  if (EMPTY_FEEDBACK.has(text)) return "no_feedback";
  if (action.status === "no_feedback" || action.status === "timeout") {
    return "no_feedback";
  }
  return "viewed";
}

export function terminalFeedbackSortRank(
  action: Pick<ExecutionAction, "terminalFeedback" | "status">
): number {
  return terminalFeedbackDisplayState(action) === "viewed" ? 0 : 1;
}
