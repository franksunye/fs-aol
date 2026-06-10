"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RUN_AGENT_OPTIONS,
  RUN_MODEL_OPTIONS,
  RUN_STATUS_OPTIONS,
  RUN_STATUS_LABELS,
  type RunQuickFilter,
  type RunsFilters,
} from "@/lib/runs-mock";
import { stripRunsDataListParams } from "@/components/data-list";
import { RUNS_HOME_PATH } from "@/lib/runs-nav";

const QUICK_TABS: { key: RunQuickFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "success", label: RUN_STATUS_LABELS.success },
  { key: "anomaly", label: RUN_STATUS_LABELS.anomaly },
  { key: "retried", label: RUN_STATUS_LABELS.retried },
];

function buildHref(
  patch: Partial<{
    quick: string;
    agent: string;
    status: string;
    model: string;
    q: string;
  }>,
  sp: URLSearchParams
): string {
  const q = new URLSearchParams(sp.toString());
  stripRunsDataListParams(q);
  q.delete("run");
  if (patch.quick !== undefined) {
    if (patch.quick === "all") q.delete("rquick");
    else q.set("rquick", patch.quick);
  }
  if (patch.agent !== undefined) {
    if (patch.agent === "all") q.delete("ragent");
    else q.set("ragent", patch.agent);
  }
  if (patch.status !== undefined) {
    if (patch.status === "all") q.delete("rstatus");
    else q.set("rstatus", patch.status);
  }
  if (patch.model !== undefined) {
    if (patch.model === "all") q.delete("rmodel");
    else q.set("rmodel", patch.model);
  }
  if (patch.q !== undefined) {
    if (patch.q) q.set("rq", patch.q);
    else q.delete("rq");
  }
  const s = q.toString();
  return s ? `${RUNS_HOME_PATH}?${s}` : RUNS_HOME_PATH;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-background text-foreground h-8 min-w-[7rem] cursor-pointer rounded-lg border px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RunsFilters({
  counts,
  filters,
}: {
  counts: Record<RunQuickFilter, number>;
  filters: RunsFilters;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <nav
        className="scrollbar-none flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1.5"
        aria-label="Runs 状态筛选"
      >
        {QUICK_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={buildHref({ quick: tab.key }, sp)}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              filters.quick === tab.key
                ? "border-primary bg-agent-surface text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1 tabular-nums opacity-80">{counts[tab.key]}</span>
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <form
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            router.push(
              buildHref({ q: String(fd.get("rq") ?? "") }, sp),
              { scroll: false }
            );
          }}
        >
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            aria-hidden
          />
          <input
            name="rq"
            defaultValue={filters.query}
            placeholder="搜索 Run ID、Agent、关联对象…"
            className="border-input bg-background placeholder:text-muted-foreground h-8 w-full rounded-lg border pr-3 pl-8 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Agent"
            value={filters.agentId}
            options={RUN_AGENT_OPTIONS}
            onChange={(agent) =>
              router.push(buildHref({ agent }, sp), { scroll: false })
            }
          />
          <FilterSelect
            label="状态"
            value={filters.status}
            options={RUN_STATUS_OPTIONS}
            onChange={(status) =>
              router.push(buildHref({ status }, sp), { scroll: false })
            }
          />
          <FilterSelect
            label="模型"
            value={filters.model}
            options={RUN_MODEL_OPTIONS}
            onChange={(model) =>
              router.push(buildHref({ model }, sp), { scroll: false })
            }
          />
        </div>
      </div>
    </div>
  );
}
