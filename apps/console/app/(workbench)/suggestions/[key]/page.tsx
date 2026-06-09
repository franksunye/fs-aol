import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSuggestion, listTracesLite } from "@/lib/suggestions";
import { getTimelineEvents } from "@/lib/timeline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DispositionBar } from "@/components/case/disposition-bar";
import { CaseWorkspace } from "@/components/case/case-workspace";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import {
  eventTypeLabel,
  statusLabel,
  decisionLabel,
  priorityClasses,
  decisionClasses,
  INBOX_TAB_LABELS,
  archiveReasonLabel,
  encodeKey,
} from "@/lib/labels";
import { analysisMetaLines } from "@/lib/analysis-meta";
import { computeStaleDaysFromStateAt } from "@/lib/suggestion-list-display";
import { buildTimelineRoundLinks, parseAgentRound } from "@/lib/agent-rounds";

export const dynamic = "force-dynamic";

export default async function SuggestionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ tab?: string; round?: string; view?: string }>;
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
  const analysisLines = analysisMetaLines(row);
  const detailBase = `/suggestions/${encodeKey(dedupeKey)}`;
  const feedView = sp.view === "feed";

  return (
    <main className="w-full px-6 py-6 lg:px-8">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> 返回工作台
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xl font-semibold">
            {row.orderNum || row.workOrderId}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {eventTypeLabel(row.eventType)} · {row.city || "—"} ·{" "}
            {statusLabel(row.status)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={priorityClasses(s.优先级)}>
            优先级 {s.优先级 || "—"}
          </Badge>
          {staleDays != null ? (
            <Badge variant="outline">滞留 {staleDays} 天</Badge>
          ) : null}
          <Badge className={decisionClasses(row.outcome?.decision)}>
            {decisionLabel(row.outcome?.decision)}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            v0.3.4
          </Badge>
        </div>
      </div>

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

      {analysisLines.length > 0 ? (
        <Card className="border-violet-200 bg-agent-surface/50 mb-4 p-3 text-xs">
          <ul className="text-muted-foreground space-y-1">
            {analysisLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <DispositionBar
        dedupeKey={row.dedupeKey}
        workOrderId={row.workOrderId}
        suggestion={s}
        currentDecision={row.outcome?.decision ?? null}
        blockerType={row.blocker?.blockerType ?? null}
        blockerNote={row.blocker?.note ?? null}
      />

      {feedView ? (
        <Card className="mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Activity Feed</h2>
            <Link
              href={detailBase}
              className="text-primary text-xs hover:underline"
            >
              返回双栏视图
            </Link>
          </div>
          <PlanTimelineSection
            events={timelineEvents}
            roundLinks={roundLinks}
            suggestionBaseHref={detailBase}
          />
        </Card>
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
          traceLite={traces}
        />
      )}
    </main>
  );
}
