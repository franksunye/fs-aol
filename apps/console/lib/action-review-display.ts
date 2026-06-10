import type { SuggestionDoc, SuggestionRow } from "./suggestions";
import { parseQuoteAmountYuan, formatYuanCompact } from "./action-review-metric-cards";
import { channelPartLine } from "./suggestion-list-display";
import { BLOCKER_LABELS, type BlockerType } from "./blockers";

export function formatQuoteBadge(s: SuggestionDoc): string | null {
  const amt = parseQuoteAmountYuan(s);
  if (amt != null) return `报价 ${formatYuanCompact(amt)}`;
  const status = s.情况判断?.报价状态?.trim();
  if (status === "已正式报价未签约") return "已报价";
  if (status === "无正式报价") return "未报价";
  return null;
}

/** 列表主文案：情境判断（优先原因摘要，避免与主行动模板重复） */
export function actionReviewSummaryPreview(s: SuggestionDoc): string {
  const summary = s.原因摘要?.trim();
  if (summary) return summary;
  const basis = s.优先级依据?.map((x) => x?.trim()).find(Boolean);
  if (basis) return basis;
  const plan = s.情况判断?.金额与方案?.trim();
  if (!plan) return "";
  const head = plan.split("；")[0]?.trim() ?? plan;
  return head.length > 96 ? `${head.slice(0, 95)}…` : head;
}

function summaryHaystack(s: SuggestionDoc): string {
  return [
    s.原因摘要,
    ...(s.优先级依据 ?? []),
    s.情况判断?.金额与方案,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function chipNotInSummary(text: string, haystack: string): boolean {
  const key = text.trim().toLowerCase();
  if (!key) return false;
  return !haystack.includes(key);
}

/**
 * 列表情境锚点：仅补充首行 badge 未覆盖、且未在摘要出现的字段。
 */
export function actionReviewContextChips(row: SuggestionRow): string[] {
  const s = row.suggestion;
  const chips: string[] = [];
  const quoteBadge = formatQuoteBadge(s);
  const haystack = summaryHaystack(s);

  const city = row.city?.trim();
  if (city && chipNotInSummary(city, haystack)) chips.push(city);

  const channel = channelPartLine(s);
  if (channel !== "—" && chipNotInSummary(channel, haystack)) {
    chips.push(channel);
  }

  const quoteStatus = s.情况判断?.报价状态?.trim();
  if (quoteStatus && !quoteBadge && chipNotInSummary(quoteStatus, haystack)) {
    chips.push(quoteStatus);
  }

  const mood = s.客户情绪?.trim();
  if (mood && mood !== "中性" && chipNotInSummary(mood, haystack)) {
    chips.push(`情绪 ${mood}`);
  }

  const blockerType = row.blocker?.blockerType;
  if (blockerType && blockerType !== "UNKNOWN") {
    const label = BLOCKER_LABELS[blockerType as BlockerType] ?? blockerType;
    chips.push(`卡点 ${label}`);
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

export function actionReviewStageLabel(row: SuggestionRow): string {
  const stage = row.suggestion.情况判断?.商机阶段?.trim();
  if (stage) return stage;
  if (row.eventType === "STALE_SIGN_PENDING") return "待签约";
  return "跟进中";
}
