import { Check, ChevronDown, Database, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TraceStep } from "@/lib/suggestions";
import { cn } from "@/lib/utils";

function stepTitle(st: TraceStep): string {
  const name = st.name || "";
  if (name === "enrich_work_order_context") return "系统查证";
  if (name === "suggest") return "生成跟进建议";
  return name || st.kind || "步骤";
}

function stepSubtitle(st: TraceStep): string {
  if (st.kind === "tool") return "读取 Mongo 报价 / 签约 / 部位与渠道";
  if (st.kind === "llm") return "基于查证事实输出 Action Spec";
  return st.kind || "";
}

export function ToolStepCard({
  step,
  index,
  defaultOpen = false,
}: {
  step: TraceStep;
  index: number;
  defaultOpen?: boolean;
}) {
  const done = step.status === "ok" || !step.status;
  const Icon = step.kind === "tool" ? Database : Sparkles;

  return (
    <details
      className="group rounded-lg border border-border bg-card shadow-sm"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            step.kind === "tool"
              ? "bg-violet-100 text-violet-700"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {index + 1}. {stepTitle(step)}
            </span>
            {done ? (
              <Check className="size-3.5 text-emerald-600" aria-hidden />
            ) : null}
            {step.latency_ms != null ? (
              <span className="text-muted-foreground font-mono text-[11px]">
                {(step.latency_ms / 1000).toFixed(1)}s
              </span>
            ) : null}
            <Badge variant="outline" className="text-[10px]">
              {step.kind || "step"}
            </Badge>
          </div>
          {stepSubtitle(step) ? (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {stepSubtitle(step)}
            </p>
          ) : null}
        </div>
        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      {step.output && Object.keys(step.output).length > 0 ? (
        <div className="border-t border-border px-3 py-2 text-xs">
          <pre className="bg-muted/40 max-h-32 overflow-auto rounded p-2 font-mono whitespace-pre-wrap">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        </div>
      ) : null}
    </details>
  );
}
