"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataListSortOrder } from "./data-list-types";

export function DataListSortableHead({
  label,
  active,
  order,
  align = "left",
  className,
  onSort,
}: {
  label: string;
  active: boolean;
  order: DataListSortOrder;
  align?: "left" | "right";
  className?: string;
  onSort: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      title={active ? `当前按${label}${order === "asc" ? "升序" : "降序"}` : `按${label}排序`}
      className={cn(
        "group -mx-1 inline-flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 transition-colors",
        "hover:bg-muted/70 hover:text-foreground",
        align === "right" && "float-right",
        active && "text-primary hover:text-primary",
        className
      )}
    >
      <span>{label}</span>
      {active ? (
        order === "asc" ? (
          <ArrowUp className="text-primary size-3 shrink-0" aria-hidden />
        ) : (
          <ArrowDown className="text-primary size-3 shrink-0" aria-hidden />
        )
      ) : (
        <ArrowUpDown
          className="size-3 shrink-0 opacity-35 transition-opacity group-hover:opacity-70"
          aria-hidden
        />
      )}
    </button>
  );
}

export function DataListStaticHead({
  label,
  align = "left",
  className,
}: {
  label: string;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground text-[11px] font-semibold tracking-wide uppercase",
        align === "right" && "float-right",
        className
      )}
    >
      {label}
    </span>
  );
}
