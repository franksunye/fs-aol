import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type DataState = "live" | "estimated" | "scenario" | "not_connected";

const DATA_STATE_META: Record<
  DataState,
  { label: string; className: string; description: string }
> = {
  live: {
    label: "真实",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "来自当前真实追踪库或真实业务数据，可下钻验证。",
  },
  estimated: {
    label: "估算",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    description: "基于真实数据或样本推导，需结合口径说明理解。",
  },
  scenario: {
    label: "样例",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    description: "用于展示 AOL 未来场景形态，不代表已生产接入。",
  },
  not_connected: {
    label: "未接入",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    description: "界面能力已占位，当前尚未接入真实配置或写路径。",
  },
};

export function dataStateLabel(state: DataState): string {
  return DATA_STATE_META[state].label;
}

export function dataStateDescription(state: DataState): string {
  return DATA_STATE_META[state].description;
}

export function DataStateBadge({
  state,
  className,
  label,
}: {
  state: DataState;
  className?: string;
  label?: string;
}) {
  const meta = DATA_STATE_META[state];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", meta.className, className)}
      title={meta.description}
    >
      {label ?? meta.label}
    </Badge>
  );
}

export function DataStateNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-xs leading-relaxed",
        className
      )}
    >
      {children}
    </p>
  );
}
