"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SecondaryMetricItem } from "@/lib/action-center-secondary";

export type { SecondaryMetricItem };

export function ActionCenterSecondaryStrip({
  title,
  items,
  trailing,
  className,
}: {
  title?: string;
  items: SecondaryMetricItem[];
  trailing?: ReactNode;
  className?: string;
}) {
  if (items.length === 0 && !trailing) return null;

  return (
    <div
      className={cn(
        "border-border/70 mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {title ? (
          <span className="text-muted-foreground shrink-0 text-[11px] font-medium">
            {title}
          </span>
        ) : null}
        {items.map((item) => {
          const chip = (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                item.active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                item.tone === "warn" && !item.active && "border-amber-200/80",
                item.tone === "danger" && !item.active && "border-red-200/80"
              )}
            >
              <span>{item.label}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  item.active ? "text-primary" : "text-foreground",
                  item.tone === "danger" && "text-red-600",
                  item.tone === "warn" && "text-amber-700"
                )}
              >
                {item.value}
              </span>
            </span>
          );

          if (item.href) {
            return (
              <Link key={item.key} href={item.href} scroll={false}>
                {chip}
              </Link>
            );
          }
          return <span key={item.key}>{chip}</span>;
        })}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      ) : null}
    </div>
  );
}
