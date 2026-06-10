"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CLOSED_LOOP_FILTER_LABELS,
  type ClosedLoopFilter,
} from "@/lib/action-flow-status";
import { stripPaneSelectionParams } from "@/lib/workbench-nav";

const FILTERS: ClosedLoopFilter[] = [
  "all",
  "completed",
  "rejected",
  "expired",
];

function buildHref(
  filter: ClosedLoopFilter,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
  q.set("tab", "closed");
  if (filter === "all") q.delete("cfilter");
  else q.set("cfilter", filter);
  if (hk) q.set("hk", hk);
  else q.delete("hk");
  return `/?${q.toString()}`;
}

export function ClosedLoopFilters({
  hk,
  current,
}: {
  hk?: string;
  current: ClosedLoopFilter;
}) {
  const sp = useSearchParams();

  return (
    <nav
      className="mb-3 flex flex-wrap gap-1.5"
      aria-label="已闭环筛选"
    >
      {FILTERS.map((filter) => (
        <Link
          key={filter}
          href={buildHref(filter, sp, hk)}
          scroll={false}
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
            current === filter
              ? "border-primary bg-agent-surface text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {CLOSED_LOOP_FILTER_LABELS[filter]}
        </Link>
      ))}
    </nav>
  );
}
