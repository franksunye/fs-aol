import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { SuggestionRow } from "@/lib/suggestions";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { encodeKey } from "@/lib/labels";
import { resolveStaleDays } from "@/lib/suggestion-list-display";
import {
  formatListTimestamp,
  formatQuoteBadge,
  opportunityConfidence,
  opportunityDurationMin,
  opportunityImpactPct,
  opportunityStageLabel,
} from "@/lib/opportunity-display";
import { cn } from "@/lib/utils";

function PriorityMark({ priority }: { priority?: string }) {
  const label = priority || "—";
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
        priority === "高" && "bg-red-50 text-red-600",
        priority === "中" && "bg-amber-50 text-amber-700",
        priority === "低" && "bg-emerald-50 text-emerald-700",
        !priority && "bg-muted text-muted-foreground"
      )}
      aria-label={`优先级 ${label}`}
    >
      {label}
    </span>
  );
}

export function OpportunityRow({
  row,
}: {
  row: SuggestionRow;
  pilots?: PilotHousekeeper[];
}) {
  const s = row.suggestion;
  const staleDays = resolveStaleDays(row);
  const href = `/suggestions/${encodeKey(row.dedupeKey)}`;
  const quoteBadge = formatQuoteBadge(s);
  const confidence = opportunityConfidence(s);
  const duration = opportunityDurationMin(s);
  const impact = opportunityImpactPct(s);
  const timestamp = formatListTimestamp(row.processedAt);

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <PriorityMark priority={s.优先级} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold group-hover:text-primary">
                {row.orderNum || row.workOrderId}
              </span>
              <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
                {opportunityStageLabel(row)}
              </span>
              {staleDays != null ? (
                <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums">
                  停滞 {staleDays} 天
                </span>
              ) : null}
              {quoteBadge ? (
                <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 tabular-nums">
                  {quoteBadge}
                </span>
              ) : null}
            </div>
            {timestamp ? (
              <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                {timestamp}
              </span>
            ) : null}
          </div>

          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
            <span>
              信心 <span className="text-foreground font-medium">{confidence}%</span>
            </span>
            <span>
              预计耗时{" "}
              <span className="text-foreground font-medium">{duration} 分钟</span>
            </span>
            <span>
              预计影响{" "}
              <span className="font-medium text-emerald-600">+{impact}% 签约率</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <span className="text-primary inline-flex items-center gap-0.5 text-xs font-medium">
          查看
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
