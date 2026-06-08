import type { SuggestionRow } from "./suggestions";
import { computeStaleDaysFromStateAt } from "./suggestion-list-display";

export function daysSinceProcessed(processedAt: string | null | undefined): number | null {
  if (!processedAt?.trim()) return null;
  const ms = Date.parse(processedAt);
  if (Number.isNaN(ms)) return null;
  const delta = Date.now() - ms;
  if (delta < 0) return 0;
  return Math.floor(delta / 86_400_000);
}

/** 详情页：Agent 分析时效与滞留对比 */
export function analysisMetaLines(row: SuggestionRow): string[] {
  const lines: string[] = [];
  const currentStale = computeStaleDaysFromStateAt(row.stateAt);
  if (currentStale != null) {
    lines.push(`当前滞留 ${currentStale} 天（由工单 state_at 现算）`);
  }
  if (row.analyzedStaleDays != null) {
    lines.push(`上次 Agent 分析时滞留 ${row.analyzedStaleDays} 天`);
  }
  const since = daysSinceProcessed(row.processedAt);
  if (since != null) {
    lines.push(`距上次分析 ${since} 天（${row.processedAt.slice(0, 16).replace("T", " ")}）`);
  }
  if (row.status.startsWith("reanalyzed")) {
    lines.push(`引擎状态：${row.status}`);
  } else if (row.status) {
    lines.push(`引擎状态：${row.status}`);
  }
  if (
    row.inboxBucket === "active" &&
    since != null &&
    since >= 3 &&
    currentStale != null &&
    row.analyzedStaleDays != null &&
    currentStale > row.analyzedStaleDays
  ) {
    lines.push("已达时间再分析条件（≥3 天或滞留加重）；若时间轴无「再分析」节点，说明下轮 cron 尚未跑完");
  }
  return lines;
}
