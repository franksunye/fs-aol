import type { SuggestionRow } from "@/lib/suggestions";
import { formatQuoteBadge } from "@/lib/action-review-display";
import { actionReviewStageLabel } from "@/lib/action-review-display";
import {
  decisionLabel,
  decisionClasses,
  priorityClasses,
} from "@/lib/labels";
import { computeStaleDaysFromStateAt } from "@/lib/suggestion-list-display";
import { BadgeStack } from "@/components/action-center/badge-stack";
import type { ListBadge } from "@/lib/list-display";

export function CaseRecordHeader({
  row,
  compact = false,
}: {
  row: SuggestionRow;
  compact?: boolean;
}) {
  const s = row.suggestion;
  const staleDays = computeStaleDaysFromStateAt(row.stateAt);
  const quoteBadge = formatQuoteBadge(s);
  const stage = actionReviewStageLabel(row);

  const badges: ListBadge[] = [
    {
      key: "priority",
      label: `优先级 ${s.优先级 || "—"}`,
      className: priorityClasses(s.优先级),
    },
    { key: "stage", label: stage, variant: "outline" },
  ];

  if (staleDays != null) {
    badges.push({
      key: "stale",
      label: `滞留 ${staleDays} 天`,
      variant: "outline",
    });
  }

  if (quoteBadge) {
    badges.push({
      key: "quote",
      label: quoteBadge,
      className: "bg-violet-50 text-violet-700 border-violet-100",
    });
  }

  if (row.city?.trim()) {
    badges.push({ key: "city", label: row.city.trim(), variant: "outline" });
  }

  badges.push({
    key: "disposition",
    label: decisionLabel(row.outcome?.decision),
    className: decisionClasses(row.outcome?.decision),
  });

  return (
    <header
      className={
        compact
          ? "border-b border-border pb-3"
          : "border-b border-border pb-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            工单记录
          </p>
          <h1
            className={
              compact
                ? "mt-1 font-mono text-lg font-semibold tracking-tight"
                : "mt-1 font-mono text-2xl font-semibold tracking-tight"
            }
          >
            {row.orderNum || row.workOrderId}
          </h1>
          {s.原因摘要?.trim() ? (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
              {s.原因摘要.trim()}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3">
        <BadgeStack items={badges} max={3} />
      </div>
    </header>
  );
}
