import type { SuggestionDoc } from "@/lib/tracking/types";

/** 从 Action Spec 金额与方案字段解析报价金额（元） */
export function parseQuoteAmountYuan(s: SuggestionDoc): number | null {
  const raw = s.情况判断?.金额与方案?.trim();
  if (!raw) return null;
  const m =
    raw.match(/(?:¥|￥)\s*([\d,]+(?:\.\d+)?)/) ??
    raw.match(/([\d,]+(?:\.\d+)?)\s*元/) ??
    raw.match(/^([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
