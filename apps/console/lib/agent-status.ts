import type { SuggestionRow } from "./suggestions";
import { computeStaleDaysFromStateAt } from "./suggestion-list-display";

export type AgentRowStatus = "pending_reanalyze" | "analyzed" | "handled";

export function resolveAgentRowStatus(row: SuggestionRow): AgentRowStatus {
  if (row.outcome?.decision) return "handled";
  const stale = computeStaleDaysFromStateAt(row.stateAt);
  const analyzed = row.analyzedStaleDays;
  const processed = new Date(row.processedAt).getTime();
  const daysSince =
    Number.isFinite(processed) && processed > 0
      ? Math.max(0, Math.floor((Date.now() - processed) / 86400000))
      : 0;
  const staleStep =
    stale != null && analyzed != null && stale >= analyzed + 7;
  const intervalHit = daysSince >= 3;
  if (intervalHit || staleStep) return "pending_reanalyze";
  return "analyzed";
}

export const AGENT_STATUS_LABELS: Record<AgentRowStatus, string> = {
  pending_reanalyze: "待再分析",
  analyzed: "已分析",
  handled: "已处置",
};
