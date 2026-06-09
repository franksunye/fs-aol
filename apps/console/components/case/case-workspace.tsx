import { Suspense } from "react";
import { AgentSummaryCard } from "./agent-summary-card";
import { NextActionCard } from "./next-action-card";
import { EvidenceTabs } from "./evidence-tabs";
import { AgentAnalysisPanel } from "@/components/agent-analysis-panel";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import type { SuggestionDoc, TraceRow } from "@/lib/suggestions";
import type { TimelineEvent } from "@/lib/timeline";
import type { AgentLogMeta } from "@/components/agent-analysis-panel";

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
  traceLite,
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
  traceLite: TraceRow[];
}) {
  const latestTrace = traceLite.length > 0 ? traceLite[traceLite.length - 1] : null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_280px]">
      <div className="space-y-4">
        <AgentSummaryCard suggestion={suggestion} />
        <NextActionCard suggestion={suggestion} />
        <EvidenceTabs trace={latestTrace} timelineCount={timelineEvents.length} />
      </div>

      <div className="space-y-4">
        <Suspense
          fallback={
            <p className="text-muted-foreground animate-pulse text-sm">
              加载 Agent Run…
            </p>
          }
        >
          <AgentAnalysisPanel
            workOrderId={workOrderId}
            dedupeKey={dedupeKey}
            fallbackSuggestion={suggestion}
            modifiedSuggestion={modifiedSuggestion}
            initialRound={initialRound}
            logMeta={logMeta}
            compact
          />
        </Suspense>
      </div>

      <aside className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Agent 时间轴
        </h2>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <PlanTimelineSection
            events={timelineEvents}
            roundLinks={roundLinks}
            suggestionBaseHref={detailBase}
            compact
          />
        </div>
      </aside>
    </div>
  );
}
