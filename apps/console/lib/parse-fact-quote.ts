/**
 * 从收件箱同步的 live_verdict（enrich 业务结论）解析报价/签约金额。
 * Fact Plane — 不得读取 suggestion JSON。
 */
export function parseFactQuoteAmountYuan(liveVerdict: string): number | null {
  const text = liveVerdict.replace(/^【结论】\s*/, "").trim();
  if (!text) return null;

  const patterns = [
    /已正式报价\s*([\d,]+(?:\.\d+)?)\s*元/,
    /正式报价\s*([\d,]+(?:\.\d+)?)\s*元/,
    /已有生效签约[^¥\d]*([\d,]+(?:\.\d+)?)\s*元/,
    /生效签约[^¥\d]*([\d,]+(?:\.\d+)?)\s*元/,
    /(?:¥|￥)\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*元/,
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}
