import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import {
  getSuggestion,
  listTracesLite,
} from "@/lib/suggestions";
import { getTimelineEvents } from "@/lib/timeline";
import { AgentAnalysisPanel } from "@/components/agent-analysis-panel";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import { DetailTabBar } from "@/components/detail-tab-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DecisionActions } from "@/components/decision-actions";
import { BlockerFeedbackForm } from "@/components/blocker-feedback";
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
import {
  buildTimelineRoundLinks,
  parseAgentRound,
  parseDetailTab,
} from "@/lib/agent-rounds";

export const dynamic = "force-dynamic";

export default async function SuggestionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ tab?: string; round?: string }>;
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

  const analysisCount = Math.max(traces.length, 1);
  const tab = parseDetailTab(sp.tab);
  const initialRound = parseAgentRound(sp.round, traces.length);
  const roundLinksMap = buildTimelineRoundLinks(timelineEvents, traces);
  const roundLinks: Record<number, number> = {};
  roundLinksMap.forEach((v, k) => {
    roundLinks[k] = v;
  });

  const staleDays = computeStaleDaysFromStateAt(row.stateAt);
  const analysisLines = analysisMetaLines(row);
  const detailBase = `/suggestions/${encodeKey(dedupeKey)}`;

  return (
    <main className="w-full px-6 py-8 lg:px-8">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> 返回列表
      </Link>

      {row.inboxBucket !== "active" ? (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <div className="font-medium">
            {INBOX_TAB_LABELS[row.inboxBucket]}
            {row.archiveReason
              ? ` · ${archiveReasonLabel(row.archiveReason)}`
              : null}
          </div>
          {row.mongoStatus ? (
            <div className="text-muted-foreground mt-1">
              Mongo status: <span className="font-mono">{row.mongoStatus}</span>
            </div>
          ) : null}
          {row.liveVerdict ? (
            <p className="text-muted-foreground mt-2 leading-relaxed">
              现场结论：{row.liveVerdict}
            </p>
          ) : null}
          {row.reconciledAt ? (
            <div className="text-muted-foreground mt-2 text-xs">
              同步于 {row.reconciledAt}
            </div>
          ) : null}
          <p className="text-muted-foreground mt-2 text-xs">
            处置与归档以本栏及 Mongo 现状为准；Agent 分析 Tab
            可查看各轮方案与查证。
          </p>
        </Card>
      ) : null}

      {analysisLines.length > 0 ? (
        <Card className="mb-4 border-violet-500/25 bg-violet-500/5 p-4 text-sm">
          <div className="font-medium text-violet-900 dark:text-violet-200">
            Agent 分析时效
            {staleDays != null ? (
              <span className="text-muted-foreground ml-2 font-normal">
                滞留 {staleDays} 天
              </span>
            ) : null}
          </div>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs leading-relaxed">
            {analysisLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-lg font-semibold">
              {row.orderNum || row.workOrderId}
            </div>
            <div className="text-muted-foreground text-sm">
              {eventTypeLabel(row.eventType)} · {row.city || "—"} ·{" "}
              {statusLabel(row.status)}
            </div>
            <p className="text-muted-foreground text-xs">
              当前建议（第 {analysisCount} 次 Agent 分析）
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={priorityClasses(s.优先级)}>
              优先级 {s.优先级 || "—"}
            </Badge>
            {s.客户情绪 ? (
              <Badge variant="outline">情绪 {s.客户情绪}</Badge>
            ) : null}
            <Badge className={decisionClasses(row.outcome?.decision)}>
              {decisionLabel(row.outcome?.decision)}
            </Badge>
          </div>
        </div>

        <Separator className="my-4" />

        <DecisionActions
          dedupeKey={row.dedupeKey}
          workOrderId={row.workOrderId}
          suggestion={s}
          currentDecision={row.outcome?.decision ?? null}
        />

        <div className="mt-4">
          <BlockerFeedbackForm
            dedupeKey={row.dedupeKey}
            workOrderId={row.workOrderId}
            currentType={row.blocker?.blockerType ?? null}
            currentNote={row.blocker?.note ?? null}
          />
        </div>
      </Card>

      <div className="mb-3">
        <DetailTabBar
          baseHref={detailBase}
          active={tab}
          analysisCount={analysisCount}
        />
      </div>

      {tab === "agent" ? (
        <Card className="p-5">
          <Suspense
            fallback={
              <p className="text-muted-foreground animate-pulse text-sm">
                加载 Agent 分析…
              </p>
            }
          >
            <AgentAnalysisPanel
              workOrderId={row.workOrderId}
              dedupeKey={row.dedupeKey}
              fallbackSuggestion={s}
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
            />
          </Suspense>
        </Card>
      ) : (
        <Card className="p-5">
          <PlanTimelineSection
            events={timelineEvents}
            roundLinks={roundLinks}
            suggestionBaseHref={detailBase}
          />
        </Card>
      )}
    </main>
  );
}
