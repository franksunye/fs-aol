import Link from "next/link";
import type { ReactNode } from "react";
import type { SuggestionRow } from "@/lib/suggestions";
import { extractBusinessFacts } from "@/lib/business-facts";
import { eventTypeLabel } from "@/lib/labels";
import { formatYuanCompact } from "@/lib/action-review-metric-cards";
import type { TimelineEvent } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import { CaseSourceBadge } from "@/components/case/case-source-badge";

function SnapshotSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
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
        <span className="text-foreground text-xs font-medium">{title}</span>
      </summary>
      <div className="px-4 pb-3">{children}</div>
    </details>
  );
}

/** 业务对象事实：仅 timeline 业务轨 / live_verdict，不含 Agent suggestion。 */
export function OpportunitySnapshotCard({
  row,
  timelineEvents,
  mobileHref,
}: {
  row: SuggestionRow;
  timelineEvents: TimelineEvent[];
  mobileHref: string;
}) {
  const facts = extractBusinessFacts(timelineEvents, row.liveVerdict);

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200/80 bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">业务查证</h2>
          <CaseSourceBadge kind="business" />
        </div>
        {facts.headline ? (
          <span className="text-muted-foreground max-w-[min(100%,28rem)] truncate text-xs">
            {facts.headline}
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
            <dt className="text-muted-foreground text-xs">正式报价</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {facts.quoteAmountYuan != null
                ? formatYuanCompact(facts.quoteAmountYuan)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">支付状态</dt>
            <dd className="mt-0.5">{facts.quotePayState ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">方案</dt>
            <dd className="mt-0.5">{facts.quotePackages ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">维修部位</dt>
            <dd className="mt-0.5 leading-relaxed">{facts.repairParts ?? "—"}</dd>
          </div>
          {facts.contractAmountYuan != null ? (
            <div>
              <dt className="text-muted-foreground text-xs">生效签约</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {formatYuanCompact(facts.contractAmountYuan)}
              </dd>
            </div>
          ) : null}
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
        {facts.source === "live_verdict" ? (
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            暂无业务时间线里程碑，以下为收件箱同步时的查证摘要；请以时间线「报价」事件为准。
          </p>
        ) : null}
      </SnapshotSection>
    </div>
  );
}
