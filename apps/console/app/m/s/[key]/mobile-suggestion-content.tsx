import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, FileText, ChevronRight } from "lucide-react";
import { getSuggestion } from "@/lib/suggestions";
import { MobileDispositionActions } from "@/components/mobile/mobile-disposition-actions";
import { MobileBlockerFeedback } from "@/components/mobile/mobile-blocker-feedback";
import {
  eventTypeLabel,
  statusLabel,
  decisionLabel,
} from "@/lib/labels";
import { primaryAction, resolveStaleDays } from "@/lib/suggestion-list-display";

function mobilePriorityClass(priority?: string): string {
  switch (priority) {
    case "高":
      return "bg-red-50 text-red-600";
    case "中":
      return "bg-amber-50 text-amber-700";
    case "低":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function mobileDecisionClass(decision?: string | null): string {
  switch (decision) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-600";
    case "modified":
      return "bg-blue-50 text-blue-700";
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
  const action = primaryAction(s);

  return (
    <div className="space-y-3 pb-6">
      {/* 工单信息卡 */}
      <section className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
        <div className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              {row.orderNum || row.workOrderId}
            </span>
            {stale != null ? (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
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
          <p className="text-sm text-zinc-500">
            {eventTypeLabel(row.eventType)} · {row.city || "—"} ·{" "}
            {statusLabel(row.status)}
          </p>
        </div>

        {/* 现在做什么 */}
        <div className="border-t border-zinc-100 bg-blue-50/60 px-4 py-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-600">现在做什么</p>
              <p className="mt-1 text-base leading-snug font-medium text-zinc-900">
                {action || "—"}
              </p>
            </div>
          </div>
        </div>

        {s.原因摘要 ? (
          <div className="border-t border-zinc-100 px-4 py-3">
            <p className="text-sm leading-relaxed text-zinc-500">{s.原因摘要}</p>
          </div>
        ) : null}
      </section>

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
        className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3.5 text-sm font-medium text-blue-600 shadow-sm active:bg-zinc-50"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          查看完整方案与查证
        </span>
        <ChevronRight className="h-5 w-5 text-zinc-300" />
      </Link>
    </div>
  );
}
