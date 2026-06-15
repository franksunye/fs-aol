import Link from "next/link";
import { Suspense } from "react";
import { CaseAgentPanel } from "./case-agent-panel";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import { CaseSection } from "./case-section";
import type { SuggestionDoc } from "@/lib/suggestions";
import type { TimelineEvent } from "@/lib/timeline";
import type { AgentLogMeta } from "@/components/agent-analysis-panel";

function TimelineRail({
  events,
  roundLinks,
  detailBase,
  activityHref,
  compactAside = false,
}: {
  events: TimelineEvent[];
  roundLinks: Record<number, number>;
  detailBase: string;
  activityHref: string;
  compactAside?: boolean;
}) {
  return (
    <CaseSection
      title="近期动态"
      action={
        <Link
          href={activityHref}
          className="text-primary text-xs font-medium hover:underline"
        >
          查看全部
        </Link>
      }
      bodyClassName={
        compactAside
          ? "max-h-[min(420px,calc(100vh-12rem))] overflow-y-auto p-3"
          : "max-h-[calc(100vh-8rem)] overflow-y-auto p-3"
      }
    >
      <PlanTimelineSection
        events={events}
        roundLinks={roundLinks}
        suggestionBaseHref={detailBase}
        compact
      />
    </CaseSection>
  );
}

export function CaseWorkspace({
  workOrderId,
  dedupeKey,
  suggestion,
  modifiedSuggestion,
  initialRound,
  logMeta,
  timelineEvents,
  roundLinks,
  detailBase,
  embedded = false,
  hideTimeline = false,
}: {
  workOrderId: string;
  dedupeKey: string;
  suggestion: SuggestionDoc;
  modifiedSuggestion: SuggestionDoc | null;
  initialRound: number;
  logMeta: AgentLogMeta;
  timelineEvents: TimelineEvent[];
  roundLinks: Record<number, number>;
  detailBase: string;
  embedded?: boolean;
  hideTimeline?: boolean;
}) {
  const activityHref = (() => {
    const [base, qs] = detailBase.includes("?")
      ? detailBase.split("?", 2)
      : [detailBase, ""];
    const q = new URLSearchParams(qs);
    q.set("panel", "activity");
    q.delete("view");
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  })();

  const agentPanel = (
    <Suspense
      fallback={
        <p className="text-muted-foreground animate-pulse text-sm">
          加载 Agent 分析…
        </p>
      }
    >
      <CaseAgentPanel
        workOrderId={workOrderId}
        dedupeKey={dedupeKey}
        fallbackSuggestion={suggestion}
        modifiedSuggestion={modifiedSuggestion}
        initialRound={initialRound}
        logMeta={logMeta}
        timelineCount={timelineEvents.length}
        activityHref={hideTimeline ? activityHref : undefined}
      />
    </Suspense>
  );

  if (embedded) {
    if (hideTimeline) {
      return <div className="flex w-full min-w-0 flex-col gap-5">{agentPanel}</div>;
    }

    return (
      <div className="grid w-full min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] xl:items-start">
        <div className="min-w-0">{agentPanel}</div>
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <TimelineRail
            events={timelineEvents}
            roundLinks={roundLinks}
            detailBase={detailBase}
            activityHref={activityHref}
            compactAside
          />
        </aside>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-5">{agentPanel}</div>
      {!hideTimeline ? (
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <TimelineRail
            events={timelineEvents}
            roundLinks={roundLinks}
            detailBase={detailBase}
            activityHref={activityHref}
          />
        </aside>
      ) : null}
    </div>
  );
}
