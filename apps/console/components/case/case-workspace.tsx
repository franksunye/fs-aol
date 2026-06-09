import Link from "next/link";
import { Suspense } from "react";
import { AgentSummaryCard } from "./agent-summary-card";
import { NextActionCard } from "./next-action-card";
import { CaseAgentPanel } from "./case-agent-panel";
import { PlanTimelineSection } from "@/components/plan-timeline-section";
import { CaseSection } from "./case-section";
import type { SuggestionDoc } from "@/lib/suggestions";
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
  /** 详情侧栏内：单列流式布局，由侧栏统一滚动 */
  embedded?: boolean;
  /** Activity Tab 已展示时间轴时隐藏内嵌副本 */
  hideTimeline?: boolean;
}) {
  const activityHref = (() => {
    const [base, qs] = detailBase.includes("?")
      ? detailBase.split("?", 2)
      : [detailBase, ""];
    const q = new URLSearchParams(qs);
    q.delete("panel");
    q.delete("view");
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  })();

  if (embedded) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2 md:items-stretch xl:grid-cols-2">
          <AgentSummaryCard suggestion={suggestion} />
          <NextActionCard suggestion={suggestion} />
        </div>

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
          />
        </Suspense>

        {!hideTimeline ? (
          <CaseSection
            title="Agent 时间轴"
            action={
              <Link
                href={activityHref}
                className="text-primary text-xs font-medium hover:underline"
              >
                查看活动时间线
              </Link>
            }
            bodyClassName="p-3"
          >
            <PlanTimelineSection
              events={timelineEvents}
              roundLinks={roundLinks}
              suggestionBaseHref={detailBase}
              compact
            />
          </CaseSection>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
          <AgentSummaryCard suggestion={suggestion} />
          <NextActionCard suggestion={suggestion} />
        </div>

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
          />
        </Suspense>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <CaseSection
          title="Agent 时间轴"
          action={
            <Link
              href={activityHref}
              className="text-primary text-xs font-medium hover:underline"
            >
              查看活动时间线
            </Link>
          }
          bodyClassName="max-h-[calc(100vh-8rem)] overflow-y-auto p-3"
        >
          <PlanTimelineSection
            events={timelineEvents}
            roundLinks={roundLinks}
            suggestionBaseHref={detailBase}
            compact
          />
        </CaseSection>
      </aside>
    </div>
  );
}
