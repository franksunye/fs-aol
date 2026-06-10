"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  Play,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  actionFlowStatusHref,
  type MyActionsSummary,
} from "@/lib/my-actions-mock";

type KpiKey =
  | "pendingDispatch"
  | "dispatched"
  | "inProgress"
  | "withFeedback"
  | "timeoutAnomaly";

const KPI_CONFIG: Record<
  KpiKey,
  {
    label: string;
    status: Parameters<typeof actionFlowStatusHref>[0];
    upIsGood: boolean;
    icon: ReactNode;
    iconClassName: string;
  }
> = {
  pendingDispatch: {
    label: "待分发",
    status: "pending_dispatch",
    upIsGood: false,
    icon: <ClipboardList className="size-4" aria-hidden />,
    iconClassName: "bg-primary/10 text-primary",
  },
  dispatched: {
    label: "已分发",
    status: "dispatched",
    upIsGood: true,
    icon: <Zap className="size-4" aria-hidden />,
    iconClassName: "bg-sky-500/10 text-sky-600",
  },
  inProgress: {
    label: "执行中",
    status: "in_progress",
    upIsGood: true,
    icon: <Play className="size-4" aria-hidden />,
    iconClassName: "bg-emerald-500/10 text-emerald-600",
  },
  withFeedback: {
    label: "已反馈",
    status: "completed",
    upIsGood: true,
    icon: <MessageSquare className="size-4" aria-hidden />,
    iconClassName: "bg-amber-500/10 text-amber-700",
  },
  timeoutAnomaly: {
    label: "超时 / 异常",
    status: "timeout_anomaly",
    upIsGood: false,
    icon: <AlertTriangle className="size-4" aria-hidden />,
    iconClassName: "bg-red-500/10 text-red-600",
  },
};

function Delta({
  delta,
  upIsGood,
}: {
  delta: number;
  upIsGood: boolean;
}) {
  if (delta === 0) {
    return <span className="text-muted-foreground text-[11px]">较昨日 持平</span>;
  }
  const up = delta > 0;
  const good = upIsGood ? up : !up;
  const arrow = up ? "↑" : "↓";
  const sign = up ? "+" : "";
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        good ? "text-emerald-600" : "text-red-600"
      )}
    >
      较昨日 {sign}
      {delta} {arrow}
    </span>
  );
}

function SummaryCard({
  kpiKey,
  value,
  delta,
  hk,
}: {
  kpiKey: KpiKey;
  value: number;
  delta: number;
  hk?: string;
}) {
  const cfg = KPI_CONFIG[kpiKey];
  return (
    <Link
      href={actionFlowStatusHref(cfg.status, hk)}
      scroll={false}
      className="block"
    >
      <Card className="gap-1.5 rounded-xl border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
        <div className="flex items-start justify-between gap-2">
          <div className="text-muted-foreground text-[11px] font-medium">
            {cfg.label}
          </div>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              cfg.iconClassName
            )}
          >
            {cfg.icon}
          </span>
        </div>
        <div className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        <Delta delta={delta} upIsGood={cfg.upIsGood} />
      </Card>
    </Link>
  );
}

export function MyActionsSummaryCards({
  summary,
  hk,
}: {
  summary: MyActionsSummary;
  hk?: string;
}) {
  const items: { key: KpiKey; value: number; delta: number }[] = [
    {
      key: "pendingDispatch",
      value: summary.pendingDispatch,
      delta: summary.pendingDispatchDelta,
    },
    {
      key: "dispatched",
      value: summary.dispatched,
      delta: summary.dispatchedDelta,
    },
    {
      key: "inProgress",
      value: summary.inProgress,
      delta: summary.inProgressDelta,
    },
    {
      key: "withFeedback",
      value: summary.withFeedback,
      delta: summary.withFeedbackDelta,
    },
    {
      key: "timeoutAnomaly",
      value: summary.timeoutAnomaly,
      delta: summary.timeoutAnomalyDelta,
    },
  ];

  return (
    <section
      className="grid grid-cols-2 gap-2 xl:grid-cols-5"
      aria-label="Action 流转指标"
    >
      {items.map((item) => (
        <SummaryCard
          key={item.key}
          kpiKey={item.key}
          value={item.value}
          delta={item.delta}
          hk={hk}
        />
      ))}
    </section>
  );
}
