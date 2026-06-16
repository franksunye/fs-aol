import { formatYuanCompact } from "@/lib/format-yuan";
import type { TimelineEvent, TimelineFormField } from "@/lib/timeline";

import type { SubjectFacts } from "@/lib/operator-model";

export type BusinessFactsSource = SubjectFacts["source"];
export type WorkOrderBusinessFacts = SubjectFacts & {
  lines: string[];
  quotePackages?: string | null;
  repairParts?: string | null;
};

function fieldValue(
  fields: TimelineFormField[],
  label: string
): string | null {
  const row = fields.find((f) => f.label === label);
  const v = row?.value?.trim();
  return v && v !== "—" ? v : null;
}

function parseYuanToken(raw: string): number | null {
  const m =
    raw.match(/(?:¥|￥)\s*([\d,]+(?:\.\d+)?)/) ??
    raw.match(/([\d,]+(?:\.\d+)?)\s*元/) ??
    raw.match(/^([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseQuoteSummary(summary: string): {
  amountYuan: number | null;
  payState: string | null;
  packages: string | null;
} {
  const parts = summary.split("·").map((p) => p.trim()).filter(Boolean);
  const amountYuan = parts[0] ? parseYuanToken(parts[0]) : null;
  const payState =
    parts.find((p) => /支付|首付款|未支付/.test(p)) ?? parts[1] ?? null;
  const packages =
    parts.find((p) => !/元|支付|首付款/.test(p) && p !== parts[0]) ??
    parts[2] ??
    null;
  return { amountYuan, payState, packages };
}

function latestBusinessEvent(
  events: TimelineEvent[],
  kind: string
): TimelineEvent | null {
  const rows = events.filter((e) => e.lane === "business" && e.kind === kind);
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => b.atMs - a.atMs)[0] ?? null;
}

function factsFromQuoteEvent(ev: TimelineEvent): Partial<WorkOrderBusinessFacts> {
  const fromSummary = parseQuoteSummary(ev.summary);
  const fields = ev.quote?.fields ?? [];
  const amountField = fieldValue(fields, "报价金额");
  const amountYuan =
    (amountField ? parseYuanToken(amountField) : null) ?? fromSummary.amountYuan;

  return {
    quoteAmountYuan: amountYuan,
    quotePayState:
      fieldValue(fields, "支付状态") ?? fromSummary.payState,
    quotePackages:
      fieldValue(fields, "方案套餐") ?? fromSummary.packages,
    repairParts:
      fieldValue(fields, "维修部位") ??
      fieldValue(fields, "施工位置"),
  };
}

function factsFromContractEvent(
  ev: TimelineEvent
): Partial<WorkOrderBusinessFacts> {
  const fields = ev.quote?.fields ?? [];
  const amountField = fieldValue(fields, "签约金额") ?? fieldValue(fields, "金额");
  const fromField = amountField ? parseYuanToken(amountField) : null;
  const fromSummary = parseYuanToken(ev.summary.split("·").pop()?.trim() ?? "");
  return {
    contractAmountYuan: fromField ?? fromSummary,
  };
}

function buildHeadline(facts: WorkOrderBusinessFacts): string | null {
  const parts: string[] = [];
  if (facts.contractAmountYuan != null) {
    parts.push(`已签约 ${formatYuanCompact(facts.contractAmountYuan)}`);
  } else if (facts.quoteAmountYuan != null) {
    parts.push(`正式报价 ${formatYuanCompact(facts.quoteAmountYuan)}`);
  }
  if (facts.quotePayState) parts.push(facts.quotePayState);
  if (facts.repairParts) parts.push(facts.repairParts);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * 业务对象事实：仅来自 timeline 业务轨（Mongo 里程碑）或 live_verdict 兜底。
 * 不得读取 suggestion / Agent 推断字段。
 */
export function extractBusinessFacts(
  timelineEvents: TimelineEvent[],
  liveVerdict = ""
): WorkOrderBusinessFacts {
  const quoteEv = latestBusinessEvent(timelineEvents, "quote");
  const contractEv = latestBusinessEvent(timelineEvents, "contract");

  let source: BusinessFactsSource = "none";
  const merged: WorkOrderBusinessFacts = {
    lane: "fact",
    source,
    quoteAmountYuan: null,
    quotePayState: null,
    contractAmountYuan: null,
    headline: null,
    lines: [],
    quotePackages: null,
    repairParts: null,
  };

  if (quoteEv) {
    Object.assign(merged, factsFromQuoteEvent(quoteEv));
    source = "timeline";
  }
  if (contractEv) {
    Object.assign(merged, factsFromContractEvent(contractEv));
    source = "timeline";
  }

  if (source === "timeline") {
    merged.source = "timeline";
    if (merged.quoteAmountYuan != null) {
      merged.lines.push(
        `正式报价 ${formatYuanCompact(merged.quoteAmountYuan)}${
          merged.quotePayState ? `（${merged.quotePayState}）` : ""
        }`
      );
    }
    if (merged.quotePackages) merged.lines.push(`方案：${merged.quotePackages}`);
    if (merged.repairParts) merged.lines.push(`部位：${merged.repairParts}`);
    if (merged.contractAmountYuan != null) {
      merged.lines.push(
        `生效签约 ${formatYuanCompact(merged.contractAmountYuan)}`
      );
    }
    merged.headline = buildHeadline(merged);
    return merged;
  }

  const verdict = liveVerdict.replace(/^【结论】\s*/, "").trim();
  if (verdict) {
    merged.source = "live_verdict";
    merged.headline = verdict;
    merged.lines.push(verdict);
  }

  return merged;
}
