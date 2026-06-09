import type { DashboardStats, Decision, SuggestionRow } from "./types";

const ADOPTED: Decision[] = ["approved", "modified", "followed_up"];

export function computeStats(rows: SuggestionRow[]): DashboardStats {
  const needFollowRows = rows.filter((r) => r.suggestion.需要跟进 !== false);
  let approved = 0;
  let rejected = 0;
  let modified = 0;
  let followedUp = 0;
  let adopted = 0;
  let capturedBlockers = 0;
  let exposureCount = 0;
  const byPriority: Record<string, number> = {};
  for (const r of needFollowRows) {
    const p = r.suggestion.优先级 || "未定";
    byPriority[p] = (byPriority[p] ?? 0) + 1;
    if (r.status === "sent") exposureCount += 1;
    const d = r.outcome?.decision;
    if (d === "approved") approved += 1;
    else if (d === "rejected") rejected += 1;
    else if (d === "modified") modified += 1;
    else if (d === "followed_up") followedUp += 1;
    if (d && ADOPTED.includes(d)) adopted += 1;
    const bt = r.blocker?.blockerType;
    if (bt && bt !== "UNKNOWN") capturedBlockers += 1;
  }
  const handled = approved + rejected + modified + followedUp;
  const total = needFollowRows.length;
  const blockerCaptureRate = total
    ? Math.round((capturedBlockers / total) * 100)
    : 0;
  return {
    total: rows.length,
    needFollow: total,
    pending: total - handled,
    approved,
    rejected,
    modified,
    followedUp,
    handledRate: total ? Math.round((handled / total) * 100) : 0,
    adoptionRate: total ? Math.round((adopted / total) * 100) : 0,
    exposureCount: exposureCount || total,
    blockerCaptureRate,
    unknownBlockerRate: total ? 100 - blockerCaptureRate : 0,
    byPriority,
  };
}
