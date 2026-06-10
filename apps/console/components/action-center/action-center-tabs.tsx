"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { InboxBucket } from "@/lib/labels";
import {
  ACTION_CENTER_TAB_ORDER,
  ACTION_CENTER_VIEW_LABELS,
  type ActionCenterView,
} from "@/lib/action-center-tabs";
import { stripDataListParamsForView } from "@/components/data-list";
import { stripPaneSelectionParams } from "@/lib/action-center-nav";
import { cn } from "@/lib/utils";

function buildHref(
  view: ActionCenterView,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
  stripDataListParamsForView(q, view === "execution" ? "execution" : "inbox");
  if (view === "active") {
    q.delete("tab");
  } else {
    q.set("tab", view);
  }
  if (view !== "active") {
    q.delete("sort");
    q.delete("priority");
  }
  if (view !== "closed") {
    q.delete("cfilter");
  }
  if (hk) q.set("hk", hk);
  else q.delete("hk");
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

function tabBadge(
  view: ActionCenterView,
  counts: Record<InboxBucket, number>,
  executionCount?: number
): number | undefined {
  if (view === "active") {
    const n = counts.active;
    return n > 0 ? n : undefined;
  }
  if (view === "execution") {
    return executionCount && executionCount > 0 ? executionCount : undefined;
  }
  if (view === "closed") {
    const n = counts.closed;
    return n > 0 ? n : undefined;
  }
  if (view === "archived") {
    const n = counts.archived;
    return n > 0 ? n : undefined;
  }
  return undefined;
}

export function ActionCenterTabs({
  current,
  hk,
  counts,
  executionCount,
}: {
  current: ActionCenterView;
  hk?: string;
  counts: Record<InboxBucket, number>;
  executionCount?: number;
}) {
  const sp = useSearchParams();

  return (
    <nav
      className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Action中心视图"
    >
      {ACTION_CENTER_TAB_ORDER.map((view) => {
        const active = view === current;
        const badge = tabBadge(view, counts, executionCount);
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
            <span>{ACTION_CENTER_VIEW_LABELS[view]}</span>
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
