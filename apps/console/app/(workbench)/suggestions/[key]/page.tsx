import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSuggestion, listTracesLite } from "@/lib/suggestions";
import { getTimelineEvents } from "@/lib/timeline";
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
  encodeKey,
} from "@/lib/labels";
import { computeStaleDaysFromStateAt } from "@/lib/suggestion-list-display";
import { buildTimelineRoundLinks, parseAgentRound } from "@/lib/agent-rounds";
import {
  detailHrefWithListContext,
  listContextFromDetailSearchParams,
  resolveWorkbenchBack,
} from "@/lib/workbench-nav";

export const dynamic = "force-dynamic";

export default async function SuggestionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{
    tab?: string;
    round?: string;
    view?: string;
    from?: string;
    hk?: string;
    sort?: string;
    priority?: string;
  }>;
}) {
  const { key } = await params;
  const sp = await searchParams;
  const dedupeKey = decodeURIComponent(key);
  const row = await getSuggestion(dedupeKey);
  if (!row) notFound();

  const s = row.suggestion;
  const modified = row.outcome?.modifiedSuggestion ?? null;
  const [timelineEvents, traces] = await Promise.all([
    getTimelineEvents(row.workOrderId),
    listTracesLite(row.workOrderId),
  ]);

  const initialRound = parseAgentRound(sp.round, traces.length);
  const roundLinksMap = buildTimelineRoundLinks(timelineEvents, traces);
  const roundLinks: Record<number, number> = {};
  roundLinksMap.forEach((v, k) => {
    roundLinks[k] = v;
  });

  const staleDays = computeStaleDaysFromStateAt(row.stateAt);
  const listContext = listContextFromDetailSearchParams(sp);
  const back = resolveWorkbenchBack(sp, row.inboxBucket);
  const detailPath = `/suggestions/${encodeKey(dedupeKey)}`;
  const detailBase = detailHrefWithListContext(detailPath, listContext);
  const feedView = sp.view === "feed";
  const mobileHref = `/m/s/${encodeURIComponent(dedupeKey)}`;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8">
      <Link
        href={back.href}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> {back.label}
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">
          {row.orderNum || row.workOrderId}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
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
          <Badge variant="outline" className="font-mono text-[10px]">
            v0.3.5
          </Badge>
        </div>
      </header>

      {row.inboxBucket !== "active" ? (
        <Card className="mb-4 border-amber-200 bg-amber-50/80 p-4 text-sm">
          <div className="font-medium">
            {INBOX_TAB_LABELS[row.inboxBucket]}
            {row.archiveReason
              ? ` · ${archiveReasonLabel(row.archiveReason)}`
              : null}
          </div>
          {row.liveVerdict ? (
            <p className="text-muted-foreground mt-2">{row.liveVerdict}</p>
          ) : null}
        </Card>
      ) : null}

      <div className="mb-5 space-y-5">
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
              href={detailHrefWithListContext(detailPath, listContext)}
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
        />
      )}
    </main>
  );
}
