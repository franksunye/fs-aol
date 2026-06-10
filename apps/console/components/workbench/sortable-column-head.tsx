"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUpDown } from "lucide-react";
import type { SuggestionSortKey } from "@/lib/suggestion-sorting";
import { nextSortSearchParams } from "@/lib/workbench-sort-nav";
import { cn } from "@/lib/utils";

const SORT_HINT: Partial<Record<SuggestionSortKey, string>> = {
  priority: "按优先级排序",
  stage: "按商机阶段排序",
  quote: "按报价金额排序",
  stale: "按停滞天数排序",
  part: "按维修部位排序",
  housekeeper: "按管家排序",
  latest: "按最近处理时间排序",
};

export function SortableColumnHead({
  label,
  columnSortKey,
  activeSortKey,
  align = "left",
  className,
}: {
  label: string;
  columnSortKey: SuggestionSortKey;
  activeSortKey: SuggestionSortKey;
  align?: "left" | "right";
  className?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = activeSortKey === columnSortKey;
  const qs = nextSortSearchParams(sp, columnSortKey).toString();
  const href = qs ? `${pathname}?${qs}` : pathname;
  const hint = SORT_HINT[columnSortKey] ?? `按${label}排序`;

  return (
    <th
      className={cn(
        "text-muted-foreground px-2 py-2 text-[11px] font-semibold tracking-wide uppercase",
        align === "right" && "text-right",
        className
      )}
      aria-sort={active ? "descending" : "none"}
    >
      <Link
        href={href}
        scroll={false}
        title={active ? `当前按${label}排序` : hint}
        className={cn(
          "group -mx-1 inline-flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 transition-colors",
          "hover:bg-muted/70 hover:text-foreground",
          align === "right" && "float-right",
          active && "text-primary hover:text-primary"
        )}
      >
        <span>{label}</span>
        {active ? (
          <ArrowDown
            className="text-primary size-3 shrink-0"
            aria-hidden
          />
        ) : (
          <ArrowUpDown
            className="size-3 shrink-0 opacity-35 transition-opacity group-hover:opacity-70"
            aria-hidden
          />
        )}
      </Link>
    </th>
  );
}
