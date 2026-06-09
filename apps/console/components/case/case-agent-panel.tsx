"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolStepCard } from "./tool-step-card";
import { EvidenceTabs } from "./evidence-tabs";
import { CaseSection } from "./case-section";
import { AnalysisDiffCard } from "@/components/analysis-diff-card";
import type { SuggestionDoc, TraceRow } from "@/lib/suggestions";
import {
  formatTraceRoundLabel,
  isReanalysisTrace,
  parseAgentRound,
} from "@/lib/agent-rounds";
import {
  reanalysisTriggerTags,
  staleDaysAt,
  wecomPushMeta,
} from "@/lib/reanalysis-triggers";
import { priorityClasses } from "@/lib/labels";
import type { AgentLogMeta } from "@/components/agent-analysis-panel";
import { cn } from "@/lib/utils";

export function CaseAgentPanel({
  workOrderId,
  dedupeKey,
  fallbackSuggestion,
  modifiedSuggestion,
  initialRound,
  logMeta,
  timelineCount,
}: {
  workOrderId: string;
  dedupeKey: string;
  fallbackSuggestion: SuggestionDoc;
  modifiedSuggestion: SuggestionDoc | null;
  initialRound: number;
  logMeta: AgentLogMeta;
  timelineCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [traces, setTraces] = useState<TraceRow[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/traces/${encodeURIComponent(workOrderId)}?all=1`
        );
        if (!res.ok) {
          throw new Error(res.status === 404 ? "暂无推理记录" : "加载失败");
        }
        const data = (await res.json()) as TraceRow[];
        if (!cancelled) setTraces(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
          setTraces([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workOrderId]);

  const sortedTraces = useMemo(() => {
    if (!traces?.length) return [];
    return [...traces].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );
  }, [traces]);

  const roundCount = Math.max(sortedTraces.length, 1);
  const round = parseAgentRound(
    searchParams.get("round") ?? String(initialRound),
    sortedTraces.length
  );
  const roundIndex = round - 1;
  const activeTrace = sortedTraces[roundIndex] ?? null;
  const prevTrace = roundIndex > 0 ? sortedTraces[roundIndex - 1] : null;

  const suggestionForRound: SuggestionDoc = useMemo(() => {
    if (activeTrace?.parsed) return activeTrace.parsed;
    return fallbackSuggestion;
  }, [activeTrace, fallbackSuggestion]);

  const prevSuggestion: SuggestionDoc | null = useMemo(() => {
    if (!prevTrace) return null;
    if (prevTrace.parsed) return prevTrace.parsed;
    if (roundIndex === 1) return fallbackSuggestion;
    return null;
  }, [prevTrace, fallbackSuggestion, roundIndex]);

  const setRound = useCallback(
    (nextRound: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("round", String(nextRound));
      params.delete("tab");
      router.replace(`/suggestions/${encodeURIComponent(dedupeKey)}?${params}`);
    },
    [dedupeKey, router, searchParams]
  );

  if (traces === undefined) {
    return (
      <p className="text-muted-foreground animate-pulse text-sm">
        加载 Agent 分析记录…
      </p>
    );
  }

  const isLatest = round === roundCount;
  const isReanalysis = activeTrace
    ? isReanalysisTrace(activeTrace, roundIndex)
    : false;

  const triggerTags =
    activeTrace && isReanalysis
      ? reanalysisTriggerTags({
          roundIndex,
          trace: activeTrace,
          prevTrace,
          stateAt: logMeta.stateAt,
          outcomeFollowedUpAt: logMeta.outcomeFollowedUpAt,
        })
      : [];

  const pushMeta = wecomPushMeta(logMeta.status, {
    isLatestRound: isLatest,
    isReanalysis,
  });

  const staleAtRound =
    activeTrace && logMeta.stateAt
      ? staleDaysAt(logMeta.stateAt, Date.parse(activeTrace.createdAt))
      : null;

  const evidenceTrace = activeTrace;

  return (
    <div className="space-y-5">
      {sortedTraces.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            分析轮次
          </span>
          {sortedTraces.map((t, i) => {
            const r = i + 1;
            return (
              <Button
                key={t.id ?? i}
                type="button"
                size="sm"
                variant={r === round ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => setRound(r)}
              >
                {formatTraceRoundLabel(t, i, sortedTraces.length)}
              </Button>
            );
          })}
        </div>
      ) : null}

      {(isReanalysis ||
        pushMeta ||
        suggestionForRound.优先级 ||
        staleAtRound != null ||
        triggerTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {isReanalysis ? "再分析" : "首次分析"}
            {isLatest ? " · 当前" : ""}
          </Badge>
          {suggestionForRound.优先级 ? (
            <Badge className={priorityClasses(suggestionForRound.优先级)}>
              优先级 {suggestionForRound.优先级}
            </Badge>
          ) : null}
          {staleAtRound != null ? (
            <Badge variant="secondary" className="text-[10px] font-normal">
              分析时滞留 {staleAtRound} 天
            </Badge>
          ) : null}
          {pushMeta ? (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-normal",
                pushMeta.tone === "sent" &&
                  "border-emerald-500/40 text-emerald-700",
                pushMeta.tone === "warn" && "border-red-500/40 text-red-600"
              )}
            >
              {pushMeta.label}
            </Badge>
          ) : null}
          {triggerTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <CaseSection title="上下文与证据" bodyClassName="p-0">
          <EvidenceTabs
            suggestion={suggestionForRound}
            trace={evidenceTrace}
            timelineCount={timelineCount}
            embedded
          />
        </CaseSection>

        <CaseSection title="本次分析变化">
          {prevSuggestion && round > 1 ? (
            <AnalysisDiffCard
              prev={prevSuggestion}
              cur={suggestionForRound}
              round={round}
              compact
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              首次分析，暂无可对比的上一轮方案。
            </p>
          )}
          {modifiedSuggestion && isLatest ? (
            <p className="text-muted-foreground mt-3 text-xs">
              管家已提交修改版方案，以 disposition 记录为准。
            </p>
          ) : null}
        </CaseSection>
      </div>

      <CaseSection title="Agent Run · 工具步骤">
        {error && sortedTraces.length === 0 ? (
          <p className="text-muted-foreground text-sm">{error}</p>
        ) : activeTrace && activeTrace.steps.length > 0 ? (
          <div className="space-y-2">
            {activeTrace.steps.map((st, i) => (
              <ToolStepCard
                key={i}
                step={st}
                index={i}
                defaultOpen={i === activeTrace.steps.length - 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            该轮暂无分步 trace，方案来自日志快照。
          </p>
        )}
      </CaseSection>
    </div>
  );
}
