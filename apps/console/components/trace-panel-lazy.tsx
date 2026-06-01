"use client";

import { useEffect, useState } from "react";
import type { TraceRow } from "@/lib/suggestions";
import { TraceView } from "@/components/trace-view";

export function TracePanelLazy({ workOrderId }: { workOrderId: string }) {
  const [trace, setTrace] = useState<TraceRow | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/traces/${encodeURIComponent(workOrderId)}`
        );
        if (!res.ok) {
          throw new Error(res.status === 404 ? "暂无推理记录" : "加载失败");
        }
        const data = (await res.json()) as TraceRow;
        if (!cancelled) setTrace(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
          setTrace(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workOrderId]);

  if (trace === undefined) {
    return (
      <p className="text-muted-foreground animate-pulse text-sm">加载查证轨…</p>
    );
  }
  if (error) {
    return <p className="text-muted-foreground text-sm">{error}</p>;
  }
  if (!trace) {
    return <p className="text-muted-foreground text-sm">暂无推理记录</p>;
  }
  return <TraceView trace={trace} />;
}
