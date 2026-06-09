import type { SuggestionDoc, SuggestionRow } from "./suggestions";
import { parseQuoteAmountYuan, formatYuanCompact } from "./workbench-metrics";

const CONFIDENCE: Record<string, number> = {
  高: 85,
  中: 72,
  低: 60,
};

const DURATION_MIN: Record<string, number> = {
  高: 15,
  中: 20,
  低: 12,
};

const IMPACT_PCT: Record<string, number> = {
  高: 31,
  中: 26,
  低: 18,
};

export function opportunityConfidence(s: SuggestionDoc): number {
  const p = s.优先级 || "中";
  let base = CONFIDENCE[p] ?? 68;
  if (s.客户情绪 === "积极") base = Math.min(95, base + 5);
  if (s.客户情绪 === "消极") base = Math.max(45, base - 8);
  return base;
}

export function opportunityDurationMin(s: SuggestionDoc): number {
  return DURATION_MIN[s.优先级 || "中"] ?? 15;
}

export function opportunityImpactPct(s: SuggestionDoc): number {
  return IMPACT_PCT[s.优先级 || "中"] ?? 20;
}

export function formatQuoteBadge(s: SuggestionDoc): string | null {
  const amt = parseQuoteAmountYuan(s);
  if (amt != null) return `报价 ${formatYuanCompact(amt)}`;
  const status = s.情况判断?.报价状态?.trim();
  if (status === "已正式报价未签约") return "已报价";
  return null;
}

export function formatListTimestamp(iso: string): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const time = d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (d >= startToday) return time;
  if (d >= startYesterday) return `昨天 ${time}`;
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function opportunityStageLabel(row: SuggestionRow): string {
  const stage = row.suggestion.情况判断?.商机阶段?.trim();
  if (stage) return stage;
  if (row.eventType === "STALE_SIGN_PENDING") return "待签约";
  return "跟进中";
}
