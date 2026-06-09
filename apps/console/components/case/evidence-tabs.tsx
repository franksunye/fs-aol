"use client";

import { useState } from "react";
import type { SuggestionDoc, TraceRow } from "@/lib/suggestions";
import { mergeEvidenceFacts } from "@/lib/evidence-facts";
import { cn } from "@/lib/utils";

type Tab = "facts" | "trace" | "timeline";

const VISIBLE_FACTS = 6;

export function EvidenceTabs({
  suggestion,
  trace,
  timelineCount,
  embedded = false,
}: {
  suggestion: SuggestionDoc;
  trace: TraceRow | null;
  timelineCount: number;
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("facts");
  const [expanded, setExpanded] = useState(false);
  const { verdict, facts } = mergeEvidenceFacts(suggestion, trace);

  const tabs: { id: Tab; label: string }[] = [
    { id: "facts", label: "关键事实" },
    { id: "trace", label: "查证" },
    { id: "timeline", label: `业务 (${timelineCount})` },
  ];

  const visibleFacts = expanded ? facts : facts.slice(0, VISIBLE_FACTS);

  return (
    <div
      className={cn(
        !embedded && "rounded-xl border border-border bg-card shadow-sm"
      )}
    >
      <div className="flex gap-1 border-b border-border p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-agent-surface text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 text-sm">
        {tab === "facts" ? (
          <>
            <ul className="space-y-2">
              {verdict ? (
                <li className="text-muted-foreground text-xs leading-relaxed">
                  · {verdict}
                  <span className="text-muted-foreground/70 ml-1">（系统结论）</span>
                </li>
              ) : null}
              {visibleFacts.length > 0 ? (
                visibleFacts.map((line) => (
                  <li
                    key={line}
                    className="text-muted-foreground text-xs leading-relaxed"
                  >
                    · {line}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground text-xs">
                  暂无引用查证，请查看 Run 步骤或执行 timeline 同步
                </li>
              )}
            </ul>
            {facts.length > VISIBLE_FACTS ? (
              <button
                type="button"
                className="text-primary mt-2 text-xs hover:underline"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "收起" : "展开全部"}
              </button>
            ) : null}
          </>
        ) : null}
        {tab === "trace" ? (
          <div className="text-muted-foreground space-y-2 text-xs leading-relaxed">
            {trace ? (
              <>
                <p>
                  {trace.steps.length} 个工具步骤 · {trace.mode} ·{" "}
                  {trace.latencyMs}ms
                </p>
                {suggestion.情况判断?.报价状态 ? (
                  <p>报价状态：{suggestion.情况判断.报价状态}</p>
                ) : null}
              </>
            ) : (
              <p>暂无 trace，见下方 Run 步骤</p>
            )}
          </div>
        ) : null}
        {tab === "timeline" ? (
          <p className="text-muted-foreground text-xs">
            右侧时间轴含 {timelineCount} 条业务与 Agent 事件（按发生时间合并）。
          </p>
        ) : null}
      </div>
    </div>
  );
}
