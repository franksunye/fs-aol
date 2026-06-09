import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SuggestionRow } from "@/lib/suggestions";
import { decisionLabel, decisionClasses } from "@/lib/labels";
import {
  suggestionDetailHref,
  type WorkbenchListContext,
} from "@/lib/workbench-nav";
import { resolveStaleDays } from "@/lib/suggestion-list-display";
import { resolveAgentRowStatus } from "@/lib/agent-status";
import { AgentStatusBadge } from "./agent-status-badge";
import {
  formatListTimestamp,
  formatQuoteBadge,
  opportunityContextChips,
  opportunitySummaryPreview,
  opportunityStageLabel,
} from "@/lib/opportunity-display";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  listContext,
  selected = false,
}: {
  row: SuggestionRow;
  listContext?: WorkbenchListContext;
  selected?: boolean;
}) {
  const s = row.suggestion;
  const staleDays = resolveStaleDays(row);
  const href = suggestionDetailHref(row.dedupeKey, listContext);
  const quoteBadge = formatQuoteBadge(s);
  const summaryPreview = opportunitySummaryPreview(s);
  const contextChips = opportunityContextChips(row);
  const timestamp = formatListTimestamp(row.processedAt);
  const agentStatus = resolveAgentRowStatus(row);

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group relative block overflow-hidden rounded-lg border p-3.5 transition-all duration-200",
        selected
          ? "border-primary/25 bg-sidebar-accent shadow-sm"
          : "border-border/80 bg-card hover:border-border hover:bg-muted/35"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "bg-primary absolute top-2 bottom-2 left-0 w-1 rounded-full transition-all duration-200",
          selected ? "opacity-100" : "w-0 opacity-0"
        )}
      />
      <div className="flex items-start gap-3 pl-0.5">
        <PriorityMark priority={s.优先级} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={cn(
                  "font-mono text-sm font-semibold transition-colors",
                  selected ? "text-primary" : "group-hover:text-primary"
                )}
              >
                {row.orderNum || row.workOrderId}
              </span>
              <AgentStatusBadge status={agentStatus} />
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
              <Badge
                variant="outline"
                className={cn("text-[10px]", decisionClasses(row.outcome?.decision))}
              >
                {decisionLabel(row.outcome?.decision)}
              </Badge>
            </div>
            {timestamp ? (
              <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                {timestamp}
              </span>
            ) : null}
          </div>

          {summaryPreview ? (
            <p className="text-foreground mt-2 line-clamp-2 text-sm leading-snug">
              {summaryPreview}
            </p>
          ) : null}

          {contextChips.length > 0 ? (
            <p className="text-muted-foreground mt-2 text-xs">
              {contextChips.join(" · ")}
            </p>
          ) : null}
        </div>
        <ChevronRight
          className={cn(
            "mt-1 size-4 shrink-0 transition-all duration-200",
            selected
              ? "text-primary translate-x-0 opacity-100"
              : "text-muted-foreground translate-x-0 opacity-30 group-hover:translate-x-0.5 group-hover:opacity-70"
          )}
        />
      </div>
    </Link>
  );
}
