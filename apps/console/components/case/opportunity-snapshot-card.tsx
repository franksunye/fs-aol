import Link from "next/link";
import type { SuggestionRow } from "@/lib/suggestions";
import {
  daysSinceProcessed,
} from "@/lib/analysis-meta";
import { channelPartLine, quoteLine } from "@/lib/suggestion-list-display";
import { computeStaleDaysFromStateAt } from "@/lib/suggestion-list-display";
import { eventTypeLabel, statusLabel } from "@/lib/labels";
import { wecomPushMeta } from "@/lib/reanalysis-triggers";
import {
  formatYuanCompact,
  parseQuoteAmountYuan,
} from "@/lib/workbench-metrics";
import { CaseSection } from "./case-section";

export function OpportunitySnapshotCard({
  row,
  mobileHref,
}: {
  row: SuggestionRow;
  mobileHref: string;
}) {
  const s = row.suggestion;
  const sit = s.情况判断;
  const channel = channelPartLine(s);
  const quoteSummary = quoteLine(s);
  const staleDays = computeStaleDaysFromStateAt(row.stateAt);
  const sinceAnalysis = daysSinceProcessed(row.processedAt);
  const quoteAmt = parseQuoteAmountYuan(s);
  const citeCount = s.引用查证?.filter((c) => c?.trim()).length ?? 0;

  const push = wecomPushMeta(row.status, {
    isLatestRound: true,
    isReanalysis: row.status.startsWith("reanalyzed"),
  });

  const headerQuote =
    quoteSummary !== "—"
      ? quoteSummary
      : sit?.报价状态?.trim() || null;

  return (
    <CaseSection
      title="工单快照"
      bodyClassName="p-3"
      action={
        headerQuote ? (
          <span className="text-muted-foreground max-w-[min(100%,28rem)] truncate text-right text-xs font-normal">
            {headerQuote}
          </span>
        ) : null
      }
    >
      <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground text-xs">事件 / 城市</dt>
          <dd className="mt-0.5 font-medium">
            {eventTypeLabel(row.eventType)}
            {row.city ? ` · ${row.city}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">工单滞留</dt>
          <dd className="mt-0.5 tabular-nums">
            {staleDays != null ? `${staleDays} 天` : "—"}
            {row.analyzedStaleDays != null ? (
              <span className="text-muted-foreground text-xs">
                {" "}
                （上次分析时 {row.analyzedStaleDays} 天）
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">距上次 Agent 分析</dt>
          <dd className="mt-0.5 tabular-nums">
            {sinceAnalysis != null ? `${sinceAnalysis} 天` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">报价</dt>
          <dd className="mt-0.5">
            {quoteAmt != null
              ? formatYuanCompact(quoteAmt)
              : sit?.报价状态 || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">渠道 / 部位</dt>
          <dd className="mt-0.5 leading-relaxed">
            {channel !== "—" ? channel : sit?.渠道与部位 || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">客户情绪</dt>
          <dd className="mt-0.5">{s.客户情绪 || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">引擎 / 推送</dt>
          <dd className="mt-0.5">
            {push?.label ?? statusLabel(row.status)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">引用查证</dt>
          <dd className="mt-0.5 tabular-nums">{citeCount} 条</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">移动反馈</dt>
          <dd className="mt-0.5">
            <Link href={mobileHref} className="text-primary hover:underline">
              打开深链页 →
            </Link>
          </dd>
        </div>
      </dl>
    </CaseSection>
  );
}
