"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MY_ACTIONS_AGENT_OPTIONS,
  type ExecutionQuickFilter,
  type ActionExecutionFilters,
} from "@/lib/action-execution-mock";
import { stripExecutionDataListParams } from "@/components/data-list";
import { stripPaneSelectionParams } from "@/lib/action-center-nav";

const QUICK_TABS: {
  key: ExecutionQuickFilter;
  label: string;
  short: string;
}[] = [
  { key: "all", label: "全部", short: "全部" },
  { key: "today", label: "今日", short: "今日" },
  { key: "high", label: "高优先级", short: "高优" },
  { key: "overdue", label: "异常", short: "异常" },
];

function buildHref(
  patch: Partial<{ quick: string; agent: string }>,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
  stripExecutionDataListParams(q);
  q.set("tab", "execution");
  q.delete("action");

  if (patch.quick !== undefined) {
    if (patch.quick === "all") q.delete("aquick");
    else q.set("aquick", patch.quick);
  }
  if (patch.agent !== undefined) {
    if (patch.agent === "all") q.delete("aagent");
    else q.set("aagent", patch.agent);
  }
  q.delete("aq");
  if (hk) q.set("hk", hk);
  else q.delete("hk");

  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export function ActionExecutionFilters({
  hk,
  counts,
  filters,
  embedded = false,
}: {
  hk?: string;
  counts: Record<ExecutionQuickFilter, number>;
  filters: ActionExecutionFilters;
  /** Inline inside DataListToolbar — no outer margin or bordered tray */
  embedded?: boolean;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  return (
    <nav
      className={cn(
        "scrollbar-none flex min-w-0 gap-1.5 overflow-x-auto",
        embedded
          ? ""
          : "mb-3 rounded-lg border border-border bg-muted/30 p-1.5"
      )}
      aria-label="行动筛选"
    >
        {QUICK_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={buildHref({ quick: tab.key }, sp, hk)}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              filters.quick === tab.key
                ? "border-primary bg-agent-surface text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.short}
            <span className="ml-1 tabular-nums opacity-80">
              {counts[tab.key]}
            </span>
          </Link>
        ))}

        <label className="relative shrink-0">
          <span className="sr-only">来源 Agent</span>
          <select
            value={filters.agentId}
            onChange={(e) => {
              router.push(buildHref({ agent: e.target.value }, sp, hk), {
                scroll: false,
              });
            }}
            className="border-input bg-background text-foreground h-7 cursor-pointer rounded-full border px-2.5 text-[11px] font-medium outline-none"
          >
            {MY_ACTIONS_AGENT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.id === "all" ? "来源：全部 Agent" : `来源：${opt.label}`}
              </option>
            ))}
          </select>
        </label>
    </nav>
  );
}
