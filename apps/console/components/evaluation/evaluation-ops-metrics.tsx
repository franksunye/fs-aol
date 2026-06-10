"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Coins, Gauge, Timer, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  evaluationAgentsHref,
  evaluationExecutionActionsHref,
  type EvaluationOpsMetric,
  type EvaluationOpsMetricKey,
} from "@/lib/evaluation-mock";

const OPS_ICONS: Record<EvaluationOpsMetricKey, LucideIcon> = {
  conversionIncrement: TrendingUp,
  cost: Coins,
  latency: Timer,
  roi: Gauge,
};

const OPS_ICON_CLASS: Record<EvaluationOpsMetricKey, string> = {
  conversionIncrement: "bg-primary/10 text-primary",
  cost: "bg-sky-100 text-sky-700",
  latency: "bg-amber-100 text-amber-700",
  roi: "bg-emerald-100 text-emerald-700",
};

function opsHref(key: EvaluationOpsMetricKey, hk?: string): string {
  switch (key) {
    case "conversionIncrement":
      return evaluationExecutionActionsHref(hk);
    case "cost":
    case "latency":
    case "roi":
      return evaluationAgentsHref(undefined, hk);
    default:
      return "/analytics";
  }
}

function Delta({ metric }: { metric: EvaluationOpsMetric }) {
  const good =
    metric.tone === "flat"
      ? false
      : metric.positiveIsGood
        ? metric.tone === "up"
        : metric.tone === "down";

  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        metric.tone === "flat"
          ? "text-muted-foreground"
          : good
            ? "text-emerald-600"
            : "text-amber-700"
      )}
    >
      {metric.deltaText}
    </span>
  );
}

export function EvaluationOpsMetrics({
  metrics,
  hk,
}: {
  metrics: EvaluationOpsMetric[];
  hk?: string;
}) {
  return (
    <section aria-label="成本、延迟与收益">
      <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
        成本、延迟与收益
      </h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = OPS_ICONS[metric.key];
          return (
            <Link
              key={metric.key}
              href={opsHref(metric.key, hk)}
              scroll={false}
              className="block"
            >
              <Card className="gap-1.5 rounded-xl border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-muted-foreground text-[11px] font-medium leading-snug">
                      {metric.label}
                    </div>
                    {metric.hint ? (
                      <p className="text-muted-foreground/80 mt-0.5 line-clamp-2 text-[10px] leading-snug">
                        {metric.hint}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      OPS_ICON_CLASS[metric.key]
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                </div>
                <div className="text-foreground text-xl font-semibold tabular-nums tracking-tight">
                  {metric.value}
                </div>
                <Delta metric={metric} />
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
