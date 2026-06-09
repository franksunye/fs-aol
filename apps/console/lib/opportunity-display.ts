import type { SuggestionDoc, SuggestionRow } from "./suggestions";
import { parseQuoteAmountYuan, formatYuanCompact } from "./workbench-metrics";
import { primaryAction } from "./suggestion-list-display";

export function formatQuoteBadge(s: SuggestionDoc): string | null {
  const amt = parseQuoteAmountYuan(s);
  if (amt != null) return `报价 ${formatYuanCompact(amt)}`;
  const status = s.情况判断?.报价状态?.trim();
  if (status === "已正式报价未签约") return "已报价";
  if (status === "无正式报价") return "未报价";
  return null;
}

/** 列表副文案：Agent 建议的主行动（Action Spec 真字段） */
export function opportunityActionPreview(s: SuggestionDoc): string {
  const action = primaryAction(s);
  return action === "—" ? "" : action;
}

/** 列表辅助信息：引用查证条数 + 客户情绪 */
export function opportunityMetaChips(s: SuggestionDoc): string[] {
  const chips: string[] = [];
  const cites = s.引用查证?.filter((c) => c?.trim()) ?? [];
  if (cites.length > 0) chips.push(`${cites.length} 条查证`);
  if (s.客户情绪?.trim()) chips.push(`情绪 ${s.客户情绪}`);
  const quoteStatus = s.情况判断?.报价状态?.trim();
  if (quoteStatus && !formatQuoteBadge(s)?.includes("报价")) {
    chips.push(quoteStatus);
  }
  return chips;
}

/** processedAt = 本条跟进建议生成时刻，非工单业务时间 */
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
  if (d >= startToday) return `建议 ${time}`;
  if (d >= startYesterday) return `建议 昨天 ${time}`;
  const date = d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `建议 ${date}`;
}

export function opportunityStageLabel(row: SuggestionRow): string {
  const stage = row.suggestion.情况判断?.商机阶段?.trim();
  if (stage) return stage;
  if (row.eventType === "STALE_SIGN_PENDING") return "待签约";
  return "跟进中";
}
