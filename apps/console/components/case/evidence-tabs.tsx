"use client";

import { useState } from "react";
import type { TraceRow } from "@/lib/suggestions";
import type { TimelineEvent } from "@/lib/timeline";
import { cn } from "@/lib/utils";

type Tab = "facts" | "trace" | "timeline";

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

export function EvidenceTabs({
  trace,
  timelineCount,
}: {
  trace: TraceRow | null;
  timelineCount: number;
}) {
  const [tab, setTab] = useState<Tab>("facts");
  const enrich = trace?.enrich ?? {};
  const evidence = asStringList(enrich.evidence_lines).filter(
    (l) => !l.startsWith("业务提示")
  );
  const verdict = String(enrich.business_verdict ?? "")
    .replace(/^【结论】\s*/, "")
    .trim();

  const tabs: { id: Tab; label: string }[] = [
    { id: "facts", label: "关键事实" },
    { id: "trace", label: "查证" },
    { id: "timeline", label: `业务 (${timelineCount})` },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
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
          <ul className="space-y-2">
            {verdict ? <li className="text-muted-foreground">· {verdict}</li> : null}
            {evidence.length > 0 ? (
              evidence.map((line) => (
                <li key={line} className="text-muted-foreground">
                  · {line}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground text-xs">暂无结构化事实</li>
            )}
          </ul>
        ) : null}
        {tab === "trace" ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {trace
              ? `${trace.steps.length} 个工具步骤 · ${trace.mode} · ${trace.latencyMs}ms`
              : "暂无 trace，见右侧 Run 面板"}
          </p>
        ) : null}
        {tab === "timeline" ? (
          <p className="text-muted-foreground text-xs">
            右侧时间轴展示 {timelineCount} 条业务与 Agent 事件。
          </p>
        ) : null}
      </div>
    </div>
  );
}
