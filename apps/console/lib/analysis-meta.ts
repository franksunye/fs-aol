import type { SuggestionRow } from "./suggestions";
import { computeStaleDaysFromStateAt } from "./suggestion-list-display";
import { statusLabel } from "./labels";
import {
  REANALYZE_INTERVAL_DAYS,
  REANALYZE_STALE_STEP_DAYS,
  wecomPushMeta,
} from "./reanalysis-triggers";

export function daysSinceProcessed(
  processedAt: string | null | undefined
): number | null {
  if (!processedAt?.trim()) return null;
  const ms = Date.parse(processedAt);
  if (Number.isNaN(ms)) return null;
  const delta = Date.now() - ms;
  if (delta < 0) return 0;
  return Math.floor(delta / 86_400_000);
}

/** 详情页顶栏：Agent 分析时效与再分析规则提示 */
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
    lines.push(
      `距上次分析 ${since} 天（${row.processedAt.slice(0, 16).replace("T", " ")}）`
    );
  }

  const push = wecomPushMeta(row.status, {
    isLatestRound: true,
    isReanalysis: row.status.startsWith("reanalyzed"),
  });
  if (push) {
    lines.push(push.label);
  } else if (row.status) {
    lines.push(`引擎状态：${statusLabel(row.status)}`);
  }

  if (row.inboxBucket === "active" && since != null && since >= REANALYZE_INTERVAL_DAYS) {
    lines.push(
      `已达间隔再分析条件（≥${REANALYZE_INTERVAL_DAYS} 天），等待下轮 cron 入池`
    );
  }
  if (
    row.inboxBucket === "active" &&
    currentStale != null &&
    row.analyzedStaleDays != null &&
    currentStale >= row.analyzedStaleDays + REANALYZE_STALE_STEP_DAYS
  ) {
    lines.push(
      `已达滞留台阶（+${REANALYZE_STALE_STEP_DAYS} 天），等待下轮 cron 再分析`
    );
  }

  return lines;
}
