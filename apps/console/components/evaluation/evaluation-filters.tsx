"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EVALUATION_ACTION_TYPE_OPTIONS,
  EVALUATION_AGENT_OPTIONS,
  EVALUATION_RANGE_OPTIONS,
  EVALUATION_SITE_OPTIONS,
  evaluationHref,
  type EvaluationFilters,
} from "@/lib/evaluation-mock";

function FilterSelect({
  label,
  paramKey,
  value,
  options,
  hk,
}: {
  label: string;
  paramKey: "range" | "esite" | "eagent" | "eaction";
  value: string;
  options: readonly { id: string; label: string }[];
  hk?: string;
}) {
  const sp = useSearchParams();

  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
      <select
        className="border-input bg-background h-9 min-w-[7.5rem] rounded-md border px-2.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          const href = evaluationHref({ [paramKey]: next, hk }, sp);
          window.location.assign(href);
        }}
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

export function EvaluationFiltersBar({
  filters,
  hk,
}: {
  filters: EvaluationFilters;
  hk?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="时间范围"
          paramKey="range"
          value={filters.range}
          options={EVALUATION_RANGE_OPTIONS}
          hk={hk}
        />
        <FilterSelect
          label="站点"
          paramKey="esite"
          value={filters.site}
          options={EVALUATION_SITE_OPTIONS}
          hk={hk}
        />
        <FilterSelect
          label="Agent"
          paramKey="eagent"
          value={filters.agentId}
          options={EVALUATION_AGENT_OPTIONS}
          hk={hk}
        />
        <FilterSelect
          label="Action 类型"
          paramKey="eaction"
          value={filters.actionType}
          options={EVALUATION_ACTION_TYPE_OPTIONS}
          hk={hk}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="刷新评估数据"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            toast.message("导出报告暂未接入真实生成", {
              description: "导出报告将在后续版本开放。",
            })
          }
        >
          <Download className="size-3.5" aria-hidden />
          导出报告
        </Button>
      </div>
    </div>
  );
}
