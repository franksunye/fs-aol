"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PriorityFilter } from "@/lib/priority-filter";
import { InboxTabs } from "@/components/inbox-tabs";
import type { InboxBucket } from "@/lib/labels";

const PRIORITY_TABS: { key: PriorityFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "高", label: "高优先级" },
  { key: "中", label: "中" },
  { key: "低", label: "低" },
  { key: "pending", label: "待反馈" },
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
  inboxTab,
  hk,
  tabCounts,
  rows,
  currentPriority,
}: {
  inboxTab: InboxBucket;
  hk?: string;
  tabCounts: Record<InboxBucket, number>;
  rows: { suggestion: { 优先级?: string }; outcome: unknown }[];
  currentPriority: PriorityFilter;
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
    <div className="mb-4 space-y-3">
      <InboxTabs current={inboxTab} hk={hk} counts={tabCounts} />
      {inboxTab === "active" ? (
        <nav
          className="flex flex-wrap gap-2"
          aria-label="优先级筛选"
        >
          {PRIORITY_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={buildPriorityHref(tab.key, sp, hk)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                currentPriority === tab.key
                  ? "border-primary bg-agent-surface text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {tab.label}
              <span className="ml-1 tabular-nums opacity-70">
                {priorityCounts[tab.key]}
              </span>
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
