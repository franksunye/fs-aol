import Link from "next/link";
import type { SuggestionRow } from "@/lib/suggestions";
import type { TimelineEvent } from "@/lib/timeline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DispositionBar } from "@/components/case/disposition-bar";
import { CaseWorkspace } from "@/components/case/case-workspace";
import { OpportunitySnapshotCard } from "@/components/case/opportunity-snapshot-card";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import { CaseSection } from "@/components/case/case-section";
import {
  decisionLabel,
  priorityClasses,
  decisionClasses,
  INBOX_TAB_LABELS,
  archiveReasonLabel,
} from "@/lib/labels";
import { computeStaleDaysFromStateAt } from "@/lib/suggestion-list-display";
import type { WorkbenchListContext } from "@/lib/workbench-nav";
import { detailHrefWithListContext } from "@/lib/workbench-nav";

export function CaseDetailView({
  row,
  timelineEvents,
  traceCount,
  initialRound,
  roundLinks,
  detailBase,
  listContext,
  feedView,
  variant,
}: {
  row: SuggestionRow;
  timelineEvents: TimelineEvent[];
  traceCount: number;
  initialRound: number;
  roundLinks: Record<number, number>;
  detailBase: string;
  listContext: WorkbenchListContext;
  feedView: boolean;
  variant: "pane" | "page";
}) {
  const s = row.suggestion;
  const modified = row.outcome?.modifiedSuggestion ?? null;
  const staleDays = computeStaleDaysFromStateAt(row.stateAt);
  const mobileHref = `/m/s/${encodeURIComponent(row.dedupeKey)}`;
  const isPane = variant === "pane";

  return (
    <div
      className={
        isPane
          ? "w-full min-w-0 px-4 py-4 lg:px-6 lg:py-5"
          : "mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8"
      }
    >
      <header className="mb-4">
        <div className="min-w-0">
          <h1
            className={
              isPane
                ? "font-mono text-lg font-semibold tracking-tight"
                : "font-mono text-2xl font-semibold tracking-tight"
            }
          >
            {row.orderNum || row.workOrderId}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={priorityClasses(s.优先级)}>
              优先级 {s.优先级 || "—"}
            </Badge>
            {staleDays != null ? (
              <Badge variant="outline" className="tabular-nums">
                滞留 {staleDays} 天
              </Badge>
            ) : null}
            <Badge className={decisionClasses(row.outcome?.decision)}>
              {decisionLabel(row.outcome?.decision)}
            </Badge>
            {!isPane ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                v0.3.5
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      {row.inboxBucket !== "active" ? (
        <Card className="mb-4 border-amber-200 bg-amber-50/80 p-3 text-sm">
          <div className="font-medium">
            {INBOX_TAB_LABELS[row.inboxBucket]}
            {row.archiveReason
              ? ` · ${archiveReasonLabel(row.archiveReason)}`
              : null}
          </div>
          {row.liveVerdict ? (
            <p className="text-muted-foreground mt-1.5 text-xs">{row.liveVerdict}</p>
          ) : null}
        </Card>
      ) : null}

      <div className="mb-4 space-y-4">
        <OpportunitySnapshotCard row={row} mobileHref={mobileHref} />
        <DispositionBar
          dedupeKey={row.dedupeKey}
          workOrderId={row.workOrderId}
          suggestion={s}
          currentDecision={row.outcome?.decision ?? null}
          blockerType={row.blocker?.blockerType ?? null}
          blockerNote={row.blocker?.note ?? null}
        />
      </div>

      {feedView ? (
        <CaseSection title="Activity Feed · 全宽时间轴">
          <div className="mb-3 flex justify-end">
            <Link
              href={detailHrefWithListContext(detailBase, listContext)}
              className="text-primary text-xs hover:underline"
            >
              返回案件视图
            </Link>
          </div>
          <PlanTimelineSection
            events={timelineEvents}
            roundLinks={roundLinks}
            suggestionBaseHref={detailBase}
          />
        </CaseSection>
      ) : (
        <CaseWorkspace
          workOrderId={row.workOrderId}
          dedupeKey={row.dedupeKey}
          suggestion={s}
          modifiedSuggestion={modified}
          initialRound={initialRound}
          logMeta={{
            status: row.status,
            stateAt: row.stateAt,
            outcomeFollowedUpAt:
              row.outcome?.decision === "followed_up"
                ? row.outcome.createdAt
                : null,
          }}
          timelineEvents={timelineEvents}
          roundLinks={roundLinks}
          detailBase={detailBase}
          embedded={isPane}
        />
      )}
    </div>
  );
}
