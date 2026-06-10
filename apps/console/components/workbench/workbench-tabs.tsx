"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { InboxBucket } from "@/lib/labels";
import {
  WORKBENCH_TAB_ORDER,
  WORKBENCH_VIEW_LABELS,
  type WorkbenchView,
} from "@/lib/workbench-tabs";
import { stripPaneSelectionParams } from "@/lib/workbench-nav";
import { cn } from "@/lib/utils";

function buildHref(
  view: WorkbenchView,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
  if (view === "active") {
    q.delete("tab");
  } else {
    q.set("tab", view);
  }
  if (view !== "active") {
    q.delete("sort");
    q.delete("priority");
  }
  if (hk) q.set("hk", hk);
  else q.delete("hk");
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

function tabBadge(
  view: WorkbenchView,
  counts: Record<InboxBucket, number>,
  actionsCount?: number
): number | undefined {
  if (view === "active") {
    const n = counts.active;
    return n > 0 ? n : undefined;
  }
  if (view === "actions") {
    return actionsCount && actionsCount > 0 ? actionsCount : undefined;
  }
  if (view === "closed") {
    const n = counts.closed;
    return n > 0 ? n : undefined;
  }
  return undefined;
}

export function WorkbenchTabs({
  current,
  hk,
  counts,
  actionsCount,
}: {
  current: WorkbenchView;
  hk?: string;
  counts: Record<InboxBucket, number>;
  actionsCount?: number;
}) {
  const sp = useSearchParams();

  return (
    <nav
      className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      aria-label="工作台视图"
    >
      {WORKBENCH_TAB_ORDER.map((view) => {
        const active = view === current;
        const badge = tabBadge(view, counts, actionsCount);
        return (
          <Link
            key={view}
            href={buildHref(view, sp, hk)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            <span>{WORKBENCH_VIEW_LABELS[view]}</span>
            {badge != null ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
