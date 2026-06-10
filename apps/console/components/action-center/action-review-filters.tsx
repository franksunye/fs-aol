"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PriorityFilter } from "@/lib/priority-filter";
import { stripPaneSelectionParams } from "@/lib/action-center-nav";

const PRIORITY_TABS: {
  key: PriorityFilter;
  label: string;
  short: string;
}[] = [
  { key: "all", label: "全部", short: "全部" },
  { key: "高", label: "高优先级", short: "高" },
  { key: "中", label: "中优先级", short: "中" },
  { key: "低", label: "低优先级", short: "低" },
  { key: "pending", label: "待我反馈", short: "待反馈" },
];

function buildPriorityHref(
  priority: PriorityFilter,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
  if (priority === "all") q.delete("priority");
  else q.set("priority", priority);
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export function ActionReviewFilters({
  hk,
  rows,
  currentPriority,
  compact = false,
  embedded = false,
}: {
  hk?: string;
  rows: { suggestion: { 优先级?: string }; outcome: unknown }[];
  currentPriority: PriorityFilter;
  compact?: boolean;
  /** Inline inside DataListToolbar — no outer margin or bordered tray */
  embedded?: boolean;
}) {
  const sp = useSearchParams();

  const priorityCounts: Record<PriorityFilter, number> = {
    all: rows.length,
    高: rows.filter((r) => r.suggestion.优先级 === "高").length,
    中: rows.filter((r) => r.suggestion.优先级 === "中").length,
    低: rows.filter((r) => r.suggestion.优先级 === "低").length,
    pending: rows.filter((r) => !r.outcome).length,
  };

  return (
    <nav
      className={cn(
        "flex gap-1.5",
        embedded
          ? "scrollbar-none min-w-0 overflow-x-auto"
          : compact
            ? "mb-3 scrollbar-none bg-muted/40 -mx-0.5 overflow-x-auto rounded-lg border border-border p-2"
            : "mb-4 flex-wrap gap-2"
      )}
      aria-label="优先级筛选"
    >
      {PRIORITY_TABS.map((tab) => (
        <Link
          key={tab.key}
          href={buildPriorityHref(tab.key, sp, hk)}
          className={cn(
            "shrink-0 rounded-full border font-medium transition-colors",
            compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
            currentPriority === tab.key
              ? "border-primary bg-agent-surface text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {compact ? tab.short : tab.label}
          <span className="ml-1 tabular-nums opacity-80">
            {priorityCounts[tab.key]}
          </span>
        </Link>
      ))}
    </nav>
  );
}
