"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  evaluationActionsHref,
  evaluationWorkbenchActiveHref,
  type EvaluationKpi,
} from "@/lib/evaluation-mock";

function kpiHref(key: string, hk?: string): string {
  switch (key) {
    case "suggestions":
      return evaluationWorkbenchActiveHref(hk);
    case "adoption":
    case "modified":
    case "rejected":
      return `/?tab=closed${hk ? `&hk=${encodeURIComponent(hk)}` : ""}`;
    case "feedback":
    case "completion":
      return evaluationActionsHref(hk);
    default:
      return "/analytics";
  }
}

function Delta({ kpi }: { kpi: EvaluationKpi }) {
  const good =
    kpi.tone === "flat"
      ? false
      : kpi.positiveIsGood
        ? kpi.tone === "up"
        : kpi.tone === "down";
  const bad = kpi.tone !== "flat" && !good;

  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        kpi.tone === "flat"
          ? "text-muted-foreground"
          : good
            ? "text-emerald-600"
            : bad
              ? "text-amber-700"
              : "text-muted-foreground"
      )}
    >
      {kpi.deltaText}
    </span>
  );
}

export function EvaluationKpiCards({
  kpis,
  hk,
}: {
  kpis: EvaluationKpi[];
  hk?: string;
}) {
  return (
    <section
      className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-7"
      aria-label="评估 KPI"
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link key={kpi.key} href={kpiHref(kpi.key, hk)} scroll={false} className="block">
            <Card className="gap-1.5 rounded-xl border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
              <div className="flex items-start justify-between gap-2">
                <div className="text-muted-foreground text-[11px] font-medium leading-snug">
                  {kpi.label}
                </div>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    kpi.iconClassName
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
              </div>
              <div className="text-foreground text-xl font-semibold tabular-nums tracking-tight">
                {kpi.value}
              </div>
              <Delta kpi={kpi} />
            </Card>
          </Link>
        );
      })}
    </section>
  );
}
