import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { SuggestionRow } from "@/lib/suggestions";
import { analysisMetaLines } from "@/lib/analysis-meta";
import { channelPartLine, quoteLine } from "@/lib/suggestion-list-display";
import { eventTypeLabel } from "@/lib/labels";
import {
  formatYuanCompact,
  parseQuoteAmountYuan,
} from "@/lib/action-review-metric-cards";
import { cn } from "@/lib/utils";

function SnapshotSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group border-b border-border last:border-b-0"
      open={defaultOpen}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 transition-colors",
          "[&::-webkit-details-marker]:hidden",
          "hover:bg-muted/30"
        )}
      >
        <ChevronRight
          className="text-muted-foreground size-3.5 shrink-0 transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span className="text-foreground text-xs font-medium">{title}</span>
      </summary>
      <div className="px-4 pb-3">{children}</div>
    </details>
  );
}

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
  const quoteAmt = parseQuoteAmountYuan(s);
  const citeCount = s.引用查证?.filter((c) => c?.trim()).length ?? 0;
  const opsLines = analysisMetaLines(row);
  const showOps = row.inboxBucket === "active" && (opsLines.length > 0 || citeCount > 0);

  const headerQuote =
    quoteSummary !== "—"
      ? quoteSummary
      : sit?.报价状态?.trim() || null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-foreground text-sm font-semibold">工单快照</h2>
        {headerQuote ? (
          <span className="text-muted-foreground max-w-[min(100%,28rem)] truncate text-xs">
            {headerQuote}
          </span>
        ) : null}
      </div>

      <SnapshotSection title="业务现状" defaultOpen>
        <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">事件 / 城市</dt>
            <dd className="mt-0.5 font-medium">
              {eventTypeLabel(row.eventType)}
              {row.city ? ` · ${row.city}` : ""}
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
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">渠道 / 部位</dt>
            <dd className="mt-0.5 leading-relaxed">
              {channel !== "—" ? channel : sit?.渠道与部位 || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">移动反馈</dt>
            <dd className="mt-0.5">
              <Link href={mobileHref} className="text-primary hover:underline">
                打开深链页 →
              </Link>
            </dd>
          </div>
          {row.analyzedStaleDays != null ? (
            <div>
              <dt className="text-muted-foreground text-xs">分析时滞留</dt>
              <dd className="mt-0.5 tabular-nums">{row.analyzedStaleDays} 天</dd>
            </div>
          ) : null}
        </dl>
      </SnapshotSection>

      {showOps ? (
        <SnapshotSection title="分析时效">
          <ul className="text-muted-foreground space-y-1.5 text-xs leading-relaxed">
            {opsLines.map((line) => (
              <li key={line}>· {line}</li>
            ))}
            {citeCount > 0 ? <li>· 引用查证 {citeCount} 条</li> : null}
          </ul>
        </SnapshotSection>
      ) : null}
    </div>
  );
}
