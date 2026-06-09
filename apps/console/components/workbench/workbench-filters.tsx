"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriorityFilter } from "@/lib/priority-filter";
import { Button } from "@/components/ui/button";
import { SuggestionSort } from "@/components/suggestion-sort";
import type { SuggestionSortKey } from "@/lib/suggestion-sorting";

const PRIORITY_TABS: { key: PriorityFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "高", label: "高优先级" },
  { key: "中", label: "中优先级" },
  { key: "低", label: "低优先级" },
  { key: "pending", label: "待我反馈" },
];

function buildPriorityHref(
  priority: PriorityFilter,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  if (priority === "all") q.delete("priority");
  else q.set("priority", priority);
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export function WorkbenchFilters({
  hk,
  rows,
  currentPriority,
  sortKey,
}: {
  hk?: string;
  rows: { suggestion: { 优先级?: string }; outcome: unknown }[];
  currentPriority: PriorityFilter;
  sortKey: SuggestionSortKey;
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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        className="flex flex-wrap gap-2"
        aria-label="优先级筛选"
      >
        {PRIORITY_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={buildPriorityHref(tab.key, sp, hk)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              currentPriority === tab.key
                ? "border-primary bg-agent-surface text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums opacity-80">
              {priorityCounts[tab.key]}
            </span>
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <SuggestionSort current={sortKey} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled
          title="v0.4 开放高级筛选"
          aria-label="筛选（即将开放）"
        >
          <SlidersHorizontal className="size-3.5" />
          筛选
        </Button>
      </div>
    </div>
  );
}
