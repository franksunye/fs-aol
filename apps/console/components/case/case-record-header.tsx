import type { SuggestionRow } from "@/lib/suggestions";
import { formatQuoteBadge } from "@/lib/action-review-display";
import { actionReviewStageLabel } from "@/lib/action-review-display";
import {
  decisionLabel,
  decisionClasses,
  priorityClasses,
  eventTypeLabel,
} from "@/lib/labels";
import { formatWorkOrderRef } from "@/lib/work-order-ref";
import { extractBusinessFacts } from "@/lib/business-facts";
import { computeStaleDaysFromStateAt } from "@/lib/suggestion-list-display";
import type { TimelineEvent } from "@/lib/timeline";
import { BadgeStack } from "@/components/action-center/badge-stack";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";
import { CaseSourceBadge } from "@/components/case/case-source-badge";
import type { ListBadge } from "@/lib/list-display";

export function CaseRecordHeader({
  row,
  timelineEvents = [],
  compact = false,
}: {
  row: SuggestionRow;
  timelineEvents?: TimelineEvent[];
  compact?: boolean;
}) {
  const s = row.suggestion;
  const staleDays = computeStaleDaysFromStateAt(row.stateAt);
  const quoteBadge = formatQuoteBadge(s);
  const stage = actionReviewStageLabel(row);
  const businessHeadline = extractBusinessFacts(
    timelineEvents,
    row.liveVerdict
  ).headline;

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
      key: "quote-agent",
      label: `Agent ${quoteBadge}`,
      className: "bg-violet-50 text-violet-700 border-violet-100",
    });
  }

  if (row.city?.trim()) {
    badges.push({ key: "city", label: row.city.trim(), variant: "outline" });
  }

  if (row.eventType?.trim()) {
    badges.push({
      key: "event",
      label: eventTypeLabel(row.eventType),
      variant: "outline",
    });
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
            {formatWorkOrderRef(row)}
          </h1>
          {businessHeadline ? (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
              <span className="text-emerald-700">业务查证 · </span>
              {businessHeadline}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <DataStateBadge state="live" label="真实建议" />
          <CaseSourceBadge kind="agent" />
          <BadgeStack items={badges} max={4} />
        </div>
        {!compact ? (
          <DataStateNote className="mt-2 max-w-3xl">
            页眉绿色文案来自 XLink 业务里程碑；紫色标签为 Agent
            推断。审批时请对照下方「业务查证」与「活动时间线」中的报价事件。
          </DataStateNote>
        ) : null}
      </div>
    </header>
  );
}
