import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ChevronRight } from "lucide-react";
import { getSuggestion } from "@/lib/suggestions";
import { AgentSummaryCard } from "@/components/case/agent-summary-card";
import { NextActionCard } from "@/components/case/next-action-card";
import { MobileDispositionActions } from "@/components/mobile/mobile-disposition-actions";
import { MobileBlockerFeedback } from "@/components/mobile/mobile-blocker-feedback";
import {
  eventTypeLabel,
  statusLabel,
  decisionLabel,
} from "@/lib/labels";
import { resolveStaleDays } from "@/lib/suggestion-list-display";

function mobilePriorityClass(priority?: string): string {
  switch (priority) {
    case "高":
      return "bg-red-50 text-red-600";
    case "中":
      return "bg-amber-50 text-amber-700";
    case "低":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function mobileDecisionClass(decision?: string | null): string {
  switch (decision) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-600";
    case "modified":
      return "bg-violet-50 text-violet-700";
    case "followed_up":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export async function MobileSuggestionContent({
  dedupeKey,
}: {
  dedupeKey: string;
}) {
  const row = await getSuggestion(dedupeKey);
  if (!row) notFound();

  const s = row.suggestion;
  const stale = resolveStaleDays(row);

  return (
    <div className="space-y-3 pb-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-foreground text-lg font-bold tracking-tight">
              {row.orderNum || row.workOrderId}
            </span>
            {stale != null ? (
              <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
                滞留 {stale} 天
              </span>
            ) : null}
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${mobilePriorityClass(s.优先级)}`}
            >
              {s.优先级 || "—"}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${mobileDecisionClass(row.outcome?.decision)}`}
            >
              {decisionLabel(row.outcome?.decision)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {eventTypeLabel(row.eventType)} · {row.city || "—"} ·{" "}
            {statusLabel(row.status)}
          </p>
        </div>
      </section>

      <AgentSummaryCard suggestion={s} />
      <NextActionCard suggestion={s} />

      <MobileDispositionActions
        dedupeKey={row.dedupeKey}
        workOrderId={row.workOrderId}
        suggestion={s}
        currentDecision={row.outcome?.decision ?? null}
      />

      <MobileBlockerFeedback
        dedupeKey={row.dedupeKey}
        workOrderId={row.workOrderId}
        currentType={row.blocker?.blockerType ?? null}
        currentNote={row.blocker?.note ?? null}
      />

      <Link
        href={`/suggestions/${encodeURIComponent(dedupeKey)}`}
        className="text-primary flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium shadow-sm active:bg-muted"
      >
        <span className="flex items-center gap-2">
          <FileText className="text-primary h-4 w-4" />
          查看完整方案与查证
        </span>
        <ChevronRight className="text-muted-foreground h-5 w-5" />
      </Link>
    </div>
  );
}
