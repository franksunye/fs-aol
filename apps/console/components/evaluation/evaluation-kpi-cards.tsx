"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Calculator,
  ClipboardList,
  FileSearch,
  ShieldAlert,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  evaluationActionsHref,
  evaluationExecutionActionsHref,
  evaluationActionReviewHref,
  type EvaluationKpi,
  type EvaluationKpiKey,
} from "@/lib/evaluation-mock";

const KPI_ICONS: Record<EvaluationKpiKey, LucideIcon> = {
  accuracy: Target,
  adoption: Bot,
  modified: ClipboardList,
  rejected: FileSearch,
  feedback: Bot,
  completion: Calculator,
  falsePositive: ShieldAlert,
};

const KPI_ICON_CLASS: Record<EvaluationKpiKey, string> = {
  accuracy: "bg-primary/10 text-primary",
  adoption: "bg-sky-100 text-sky-700",
  modified: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-600",
  feedback: "bg-emerald-100 text-emerald-700",
  completion: "bg-violet-100 text-violet-700",
  falsePositive: "bg-orange-100 text-orange-700",
};

function kpiHref(key: EvaluationKpiKey, hk?: string): string {
  switch (key) {
    case "accuracy":
      return evaluationActionReviewHref(hk);
    case "adoption":
    case "modified":
    case "rejected":
      return `/?tab=closed${hk ? `&hk=${encodeURIComponent(hk)}` : ""}`;
    case "feedback":
    case "completion":
      return evaluationActionsHref(hk);
    case "falsePositive":
      return `${evaluationExecutionActionsHref(hk)}&aquick=agent`;
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
    <section aria-label="Agent 效果 KPI">
      <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
        效果与质量指标
      </h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-7">
        {kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.key];
          return (
            <Link
              key={kpi.key}
              href={kpiHref(kpi.key, hk)}
              scroll={false}
              className="block"
            >
              <Card className="gap-1.5 rounded-xl border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-muted-foreground text-[11px] font-medium leading-snug">
                    {kpi.label}
                  </div>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      KPI_ICON_CLASS[kpi.key]
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
      </div>
    </section>
  );
}
