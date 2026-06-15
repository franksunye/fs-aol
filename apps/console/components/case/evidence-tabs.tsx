"use client";

import { useState } from "react";
import Link from "next/link";
import type { SuggestionDoc, TraceRow } from "@/lib/suggestions";
import { mergeEvidenceFacts } from "@/lib/evidence-facts";
import { cn } from "@/lib/utils";

const VISIBLE_FACTS = 6;

export function EvidenceTabs({
  suggestion,
  trace,
  timelineCount,
  embedded = false,
  activityHref,
}: {
  suggestion: SuggestionDoc;
  trace: TraceRow | null;
  timelineCount: number;
  embedded?: boolean;
  /** 分栏模式无右侧时间轴时，链到活动时间线 Tab */
  activityHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { verdict, facts } = mergeEvidenceFacts(suggestion, trace);
  const visibleFacts = expanded ? facts : facts.slice(0, VISIBLE_FACTS);

  return (
    <div
      className={cn(
        !embedded && "rounded-xl border border-border bg-card shadow-sm"
      )}
    >
      <div className={cn("px-4 py-2.5", !embedded && "border-b border-border")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!embedded ? (
            <p className="text-foreground text-xs font-medium">关键事实</p>
          ) : null}
          {activityHref && timelineCount > 0 ? (
            <Link
              href={activityHref}
              className="text-primary text-xs hover:underline"
            >
              时间线 · {timelineCount} 条
            </Link>
          ) : null}
        </div>
        {trace ? (
          <p className="text-muted-foreground mt-1 text-[11px]">
            查证 {trace.steps.length} 步 · {trace.mode}
            {trace.latencyMs ? ` · ${trace.latencyMs}ms` : ""}
          </p>
        ) : null}
      </div>
      <div className="p-3 text-sm">
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
              暂无引用查证，请展开分析过程或同步时间线
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
      </div>
    </div>
  );
}
