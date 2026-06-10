"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MY_ACTIONS_AGENT_OPTIONS,
  type MyActionQuickFilter,
  type MyActionsFilters,
} from "@/lib/my-actions-mock";
import { stripPaneSelectionParams } from "@/lib/workbench-nav";

const QUICK_TABS: {
  key: MyActionQuickFilter;
  label: string;
  short: string;
}[] = [
  { key: "all", label: "全部", short: "全部" },
  { key: "today", label: "今日", short: "今日" },
  { key: "high", label: "高优先级", short: "高优" },
  { key: "overdue", label: "逾期", short: "逾期" },
];

function buildHref(
  patch: Partial<{ quick: string; agent: string; q: string }>,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
  q.set("tab", "actions");
  q.delete("action");

  if (patch.quick !== undefined) {
    if (patch.quick === "all") q.delete("aquick");
    else q.set("aquick", patch.quick);
  }
  if (patch.agent !== undefined) {
    if (patch.agent === "all") q.delete("aagent");
    else q.set("aagent", patch.agent);
  }
  if (patch.q !== undefined) {
    if (patch.q) q.set("aq", patch.q);
    else q.delete("aq");
  }
  if (hk) q.set("hk", hk);
  else q.delete("hk");

  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export function MyActionsFilters({
  hk,
  counts,
  filters,
}: {
  hk?: string;
  counts: Record<MyActionQuickFilter, number>;
  filters: MyActionsFilters;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  return (
    <div className="mb-3 space-y-2">
      <nav
        className="scrollbar-none flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1.5"
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

        <label className="relative ml-auto shrink-0">
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

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const query = String(fd.get("aq") ?? "");
          router.push(buildHref({ q: query }, sp, hk), { scroll: false });
        }}
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <input
          name="aq"
          defaultValue={filters.query}
          placeholder="搜索行动、商机、客户…"
          className="border-input bg-background placeholder:text-muted-foreground h-8 w-full rounded-lg border pr-3 pl-8 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </form>
    </div>
  );
}
