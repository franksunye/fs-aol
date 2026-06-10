"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  computeRunsSummary,
  filterRuns,
  getRunsMockData,
  type RunQuickFilter,
  type RunsFilters as RunsFilterState,
} from "@/lib/runs-mock";
import { RunsSummaryCards } from "./runs-summary-cards";
import { RunsFilters } from "./runs-filters";
import { RunsList } from "./runs-list";
import { RunsDetailPanel } from "./runs-detail-panel";
import { RunsSplitLayout } from "./runs-split-layout";

function parseQuickFilter(value?: string | null): RunQuickFilter {
  if (value === "success" || value === "anomaly" || value === "retried") {
    return value;
  }
  return "all";
}

export function RunsPage({ hkFilter }: { hkFilter?: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const allRuns = useMemo(() => getRunsMockData(), []);

  const filters: RunsFilterState = useMemo(
    () => ({
      quick: parseQuickFilter(sp.get("rquick")),
      agentId: sp.get("ragent")?.trim() || "all",
      status: sp.get("rstatus")?.trim() || "all",
      model: sp.get("rmodel")?.trim() || "all",
      query: sp.get("rq")?.trim() || "",
    }),
    [sp]
  );

  const filtered = useMemo(
    () => filterRuns(allRuns, filters),
    [allRuns, filters]
  );

  const summary = useMemo(() => computeRunsSummary(allRuns), [allRuns]);

  const quickCounts = useMemo(() => {
    const base = filterRuns(allRuns, { ...filters, quick: "all", query: "" });
    return {
      all: base.length,
      success: base.filter((r) => r.status === "success").length,
      anomaly: base.filter((r) => r.status === "anomaly").length,
      retried: base.filter((r) => r.status === "retried").length,
    };
  }, [allRuns, filters]);

  const selectedId = sp.get("run")?.trim() || null;
  const selectedRun = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  // 筛选变化导致当前 run 不在列表中时，清除无效选中（不自动展开详情）
  useEffect(() => {
    if (selectedId && filtered.length > 0 && !selectedRun) {
      const q = new URLSearchParams(sp.toString());
      q.delete("run");
      router.replace(`/runs?${q.toString()}`, { scroll: false });
    }
  }, [selectedId, filtered, selectedRun, sp, router]);

  const listPane = (
    <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-4">
      <RunsList
        className="min-h-0 flex-1"
        items={filtered}
        selectedId={selectedId}
        hk={hkFilter}
        layout={selectedId ? "narrow" : "wide"}
        resetDeps={[
          filters.quick,
          filters.agentId,
          filters.status,
          filters.model,
          filters.query,
        ]}
      />
    </div>
  );

  const detailPane = selectedRun ? (
    <RunsDetailPanel key={selectedRun.id} run={selectedRun} hk={hkFilter} />
  ) : null;

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-border px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <Play className="size-4" aria-hidden />
              </span>
              <h1 className="text-xl font-semibold tracking-tight">
                Runs 运行中心
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
              观测 Agent 技术运行时状态：触发链路、模型成本、工具 I/O 与 Action
              产出（非业务 Action 流转）
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.refresh()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              刷新
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toast.message("导出功能即将开放")}
            >
              全部站点
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => toast.message("导出功能即将开放")}
            >
              <Download className="size-3.5" aria-hidden />
              导出
            </Button>
          </div>
        </div>
        <RunsSummaryCards summary={summary} />
        <RunsFilters counts={quickCounts} filters={filters} />
      </div>

      <RunsSplitLayout
        list={listPane}
        detail={detailPane}
        selectedRunId={selectedRun ? selectedRun.id : null}
      />
    </main>
  );
}
