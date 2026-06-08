import type { TraceRow } from "./suggestions";
import type { TimelineEvent } from "./timeline";

export function formatTraceRoundLabel(
  trace: TraceRow,
  roundIndex: number,
  total: number
): string {
  const d = trace.createdAt ? new Date(trace.createdAt) : null;
  const when =
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "";
  const kind =
    roundIndex === 0
      ? "首次分析"
      : trace.mode.includes("reanaly")
        ? "再分析"
        : `第 ${roundIndex + 1} 次`;
  return when ? `${kind} · ${when}` : `${kind}（${roundIndex + 1}/${total}）`;
}

export function isReanalysisTrace(trace: TraceRow, index: number): boolean {
  return index > 0 || trace.mode.toLowerCase().includes("reanaly");
}

/** 将时间轴上的 suggestion/reanalysis 节点映射到 trace 轮次（1-based） */
export function buildTimelineRoundLinks(
  events: TimelineEvent[],
  traces: TraceRow[]
): Map<number, number> {
  const map = new Map<number, number>();
  if (traces.length === 0) return map;

  const sorted = [...traces].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );

  for (const ev of events) {
    if (ev.kind !== "suggestion" && ev.kind !== "reanalysis") continue;
    if (ev.traceRound != null && ev.traceRound > 0) {
      map.set(ev.id, ev.traceRound);
      continue;
    }
    let bestIdx = -1;
    let bestDelta = Infinity;
    sorted.forEach((t, i) => {
      const ms = Date.parse(t.createdAt);
      if (Number.isNaN(ms)) return;
      const delta = Math.abs(ms - ev.atMs);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0 && bestDelta < 5 * 60 * 1000) {
      map.set(ev.id, bestIdx + 1);
    }
  }
  return map;
}

export function parseAgentRound(
  raw: string | undefined,
  traceCount: number
): number {
  const total = Math.max(traceCount, 1);
  const n = parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return total;
  return Math.min(n, total);
}

export function parseDetailTab(
  raw: string | undefined
): "agent" | "timeline" {
  return raw === "timeline" ? "timeline" : "agent";
}
