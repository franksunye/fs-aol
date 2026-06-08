"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanView } from "@/components/plan-view";
import { TraceView } from "@/components/trace-view";
import type { SuggestionDoc, TraceRow } from "@/lib/suggestions";
import {
  formatTraceRoundLabel,
  isReanalysisTrace,
  parseAgentRound,
} from "@/lib/agent-rounds";
import { priorityClasses } from "@/lib/labels";

export function AgentAnalysisPanel({
  workOrderId,
  dedupeKey,
  fallbackSuggestion,
  modifiedSuggestion,
  initialRound,
}: {
  workOrderId: string;
  dedupeKey: string;
  fallbackSuggestion: SuggestionDoc;
  modifiedSuggestion: SuggestionDoc | null;
  initialRound: number;
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

  const suggestionForRound: SuggestionDoc = useMemo(() => {
    if (activeTrace?.parsed) return activeTrace.parsed;
    if (roundIndex === 0) return fallbackSuggestion;
    return fallbackSuggestion;
  }, [activeTrace, fallbackSuggestion, roundIndex]);

  const setRound = useCallback(
    (nextRound: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "agent");
      params.set("round", String(nextRound));
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

  if (error && sortedTraces.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{error}</p>
        <PlanView s={fallbackSuggestion} title="跟进方案（日志快照）" />
      </div>
    );
  }

  const isLatest = round === roundCount;
  const isReanalysis = activeTrace
    ? isReanalysisTrace(activeTrace, roundIndex)
    : false;

  return (
    <div className="space-y-5">
      {sortedTraces.length > 1 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            分析轮次（共 {sortedTraces.length} 次）
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedTraces.map((t, i) => {
              const r = i + 1;
              const selected = r === round;
              return (
                <Button
                  key={t.id ?? i}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  className="h-auto max-w-full py-1.5 text-left text-xs font-normal whitespace-normal"
                  onClick={() => setRound(r)}
                >
                  {formatTraceRoundLabel(t, i, sortedTraces.length)}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

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
        {activeTrace?.mode ? (
          <span className="text-muted-foreground font-mono text-[11px]">
            {activeTrace.mode}
          </span>
        ) : null}
      </div>

      <section>
        <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
          跟进方案
        </h3>
        <PlanView
          s={suggestionForRound}
          title={
            sortedTraces.length > 1
              ? `第 ${round} 次分析输出的方案`
              : undefined
          }
        />
      </section>

      {modifiedSuggestion && isLatest ? (
        <>
          <Separator />
          <PlanView s={modifiedSuggestion} title="人工修改后的方案" />
        </>
      ) : null}

      <Separator />

      <section>
        <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
          推理与查证
        </h3>
        {activeTrace ? (
          <TraceView trace={activeTrace} />
        ) : (
          <p className="text-muted-foreground text-sm">
            该轮暂无分步 trace，方案来自日志快照。
          </p>
        )}
      </section>
    </div>
  );
}
