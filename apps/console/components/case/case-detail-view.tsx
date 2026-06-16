import type { ReactNode } from "react";
import type { SuggestionRow } from "@/lib/suggestions";
import type { TimelineEvent } from "@/lib/timeline";
import { Card } from "@/components/ui/card";
import { DispositionBar } from "@/components/case/disposition-bar";
import { CaseWorkspace } from "@/components/case/case-workspace";
import { AgentSummaryCard } from "@/components/case/agent-summary-card";
import { NextActionCard } from "@/components/case/next-action-card";
import { OpportunitySnapshotCard } from "@/components/case/opportunity-snapshot-card";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import { CaseSection } from "@/components/case/case-section";
import { CaseRecordHeader } from "@/components/case/case-record-header";
import { CaseSourceBadge } from "@/components/case/case-source-badge";
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
  footer,
}: {
  row: SuggestionRow;
  timelineEvents: TimelineEvent[];
  initialRound: number;
  roundLinks: Record<number, number>;
  detailBase: string;
  panel: DetailPanel;
  variant: "pane" | "page";
  /** 页底辅助区（如信任轨与执行链接） */
  footer?: ReactNode;
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
      <CaseRecordHeader row={row} timelineEvents={timelineEvents} compact={isPane} />

      {row.inboxBucket !== "active" ? (
        <Card className="mt-4 border-amber-200 bg-amber-50/80 p-3 text-sm">
          <div className="font-medium">
            {INBOX_TAB_LABELS[row.inboxBucket]}
            {row.archiveReason
              ? ` · ${archiveReasonLabel(row.archiveReason)}`
              : null}
          </div>
        </Card>
      ) : null}

      <div className="mt-4">
        <OpportunitySnapshotCard
          row={row}
          timelineEvents={timelineEvents}
          mobileHref={mobileHref}
        />
      </div>

      <div className="mt-4">
        <p className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium">
          <span className="text-foreground">Agent 分析</span>
          <CaseSourceBadge kind="agent" />
        </p>
        <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
          <NextActionCard suggestion={s} />
          <AgentSummaryCard suggestion={s} />
        </div>
      </div>

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
        <CaseSection title="活动时间线" bodyClassName="p-3">
          <p className="text-muted-foreground mb-3 text-xs">
            灰色数据库图标为 XLink 业务里程碑；紫色星火为 Agent
            工作记录（含查证快照与跟进建议，可能与业务事实不一致，须对照核对）。
          </p>
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
          hideTimeline={isActivity}
        />
      )}

      {footer}
    </div>
  );
}
