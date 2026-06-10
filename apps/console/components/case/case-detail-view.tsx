import type { SuggestionRow } from "@/lib/suggestions";
import type { TimelineEvent } from "@/lib/timeline";
import { Card } from "@/components/ui/card";
import { DispositionBar } from "@/components/case/disposition-bar";
import { CaseWorkspace } from "@/components/case/case-workspace";
import { OpportunitySnapshotCard } from "@/components/case/opportunity-snapshot-card";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import { CaseSection } from "@/components/case/case-section";
import { CaseRecordHeader } from "@/components/case/case-record-header";
import { CaseDetailTabs } from "@/components/case/case-detail-tabs";
import { INBOX_TAB_LABELS, archiveReasonLabel } from "@/lib/labels";
import type { DetailPanel } from "@/lib/action-center-nav";
export function CaseDetailView({
  row,
  timelineEvents,
  initialRound,
  roundLinks,
  detailBase,
  panel,
  variant,
}: {
  row: SuggestionRow;
  timelineEvents: TimelineEvent[];
  initialRound: number;
  roundLinks: Record<number, number>;
  detailBase: string;
  panel: DetailPanel;
  variant: "pane" | "page";
}) {
  const s = row.suggestion;
  const modified = row.outcome?.modifiedSuggestion ?? null;
  const mobileHref = `/m/s/${encodeURIComponent(row.dedupeKey)}`;
  const isPane = variant === "pane";
  const isActivity = panel === "activity";

  return (
    <div
      className={
        isPane
          ? "w-full min-w-0 px-4 py-4 lg:px-6 lg:py-5"
          : "mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8"
      }
    >
      <CaseRecordHeader row={row} compact={isPane} />

      {row.inboxBucket !== "active" ? (
        <Card className="mt-4 border-amber-200 bg-amber-50/80 p-3 text-sm">
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

      <div className="mt-4">
        <DispositionBar
          dedupeKey={row.dedupeKey}
          workOrderId={row.workOrderId}
          suggestion={s}
          currentDecision={row.outcome?.decision ?? null}
          blockerType={row.blocker?.blockerType ?? null}
          blockerNote={row.blocker?.note ?? null}
        />
      </div>

      <CaseDetailTabs active={panel} />

      {isActivity ? (
        <CaseSection title="Activity · 业务与 Agent 事件" bodyClassName="p-3">
          <PlanTimelineSection
            events={timelineEvents}
            roundLinks={roundLinks}
            suggestionBaseHref={detailBase}
          />
        </CaseSection>
      ) : (
        <div className="space-y-4">
          <OpportunitySnapshotCard row={row} mobileHref={mobileHref} />
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
            hideTimeline={isPane}
          />
        </div>
      )}
    </div>
  );
}
