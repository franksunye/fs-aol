"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import type { SuggestionSortKey } from "@/lib/suggestion-sorting";
import { nextSortSearchParams } from "@/lib/workbench-sort-nav";
import { cn } from "@/lib/utils";

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
        className={cn(
          "inline-flex items-center gap-0.5 transition-colors hover:text-foreground",
          align === "right" && "float-right",
          active && "text-primary"
        )}
      >
        <span>{label}</span>
        {active ? (
          <ArrowDown className="size-3 shrink-0 opacity-80" aria-hidden />
        ) : null}
      </Link>
    </th>
  );
}
