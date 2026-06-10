"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { formatDateKey } from "@/lib/calendar-mock";
import type { ExecutionStatus } from "@/lib/execution-status";
import {
  filterExecutionActions,
  getExecutionActionsMockData,
  resolveExecutionAssigneeFromHk,
  type ExecutionQuickFilter,
  type ActionExecutionFilters as ExecutionFilterState,
} from "@/lib/action-execution-mock";
import { ActionExecutionFilters } from "./action-execution-filters";
import { ActionExecutionList } from "./action-execution-list";
import { ActionExecutionDetail } from "./action-execution-detail";
import { ActionExecutionSplitLayout } from "./action-execution-split-layout";

function parseQuickFilter(value?: string | null): ExecutionQuickFilter {
  if (
    value === "today" ||
    value === "high" ||
    value === "overdue" ||
    value === "agent"
  ) {
    return value;
  }
  return "all";
}

function parseStatusFilter(
  value?: string | null
): ExecutionStatus | "timeout_anomaly" | undefined {
  const v = value?.trim();
  if (v === "timeout_anomaly") return "timeout_anomaly";
  if (
    v === "pending_dispatch" ||
    v === "dispatched" ||
    v === "in_progress" ||
    v === "completed" ||
    v === "rejected" ||
    v === "timeout" ||
    v === "no_feedback"
  ) {
    return v;
  }
  return undefined;
}

export function ActionExecutionView({
  hkFilter,
  pilots = [],
}: {
  hkFilter?: string;
  pilots?: PilotHousekeeper[];
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const allActions = useMemo(() => getExecutionActionsMockData(), []);
  const hkAssignee = useMemo(
    () => resolveExecutionAssigneeFromHk(hkFilter, pilots),
    [hkFilter, pilots]
  );

  const filters: ExecutionFilterState = useMemo(
    () => ({
      quick: parseQuickFilter(sp.get("aquick")),
      agentId: sp.get("aagent")?.trim() || "all",
      query: sp.get("aq")?.trim() || "",
      hk: hkAssignee,
      status: parseStatusFilter(sp.get("astatus")),
    }),
    [sp, hkAssignee]
  );

  const filtered = useMemo(
    () => filterExecutionActions(allActions, filters),
    [allActions, filters]
  );

  const quickCounts = useMemo(() => {
    const today = formatDateKey(new Date());
    const base = filterExecutionActions(allActions, {
      ...filters,
      quick: "all",
      query: "",
    });
    return {
      all: base.length,
      today: base.filter((a) => a.dueDate === today).length,
      high: base.filter((a) => a.priority === "high").length,
      overdue: base.filter(
        (a) => a.status === "timeout" || a.status === "no_feedback"
      ).length,
      agent: base.length,
    };
  }, [allActions, filters]);

  const selectedId = sp.get("action")?.trim() || null;
  const selectedAction = useMemo(
    () => filtered.find((a) => a.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  // 筛选变化导致当前 action 不在列表中时，清除无效选中（不自动展开详情）
  useEffect(() => {
    if (selectedId && filtered.length > 0 && !selectedAction) {
      const q = new URLSearchParams(sp.toString());
      q.delete("action");
      router.replace(`/?${q.toString()}`, { scroll: false });
    }
  }, [selectedId, filtered, selectedAction, sp, router]);

  const filterBar = (
    <ActionExecutionFilters
      hk={hkFilter}
      counts={quickCounts}
      filters={filters}
      embedded
    />
  );

  const listPane = (
    <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-4">
      {filtered.length === 0 ? (
        <div className="mb-3 shrink-0">
          <ActionExecutionFilters
            hk={hkFilter}
            counts={quickCounts}
            filters={filters}
          />
        </div>
      ) : null}
      <ActionExecutionList
        className="min-h-0 flex-1"
        items={filtered}
        selectedId={selectedId}
        hk={hkFilter}
        layout={selectedId ? "narrow" : "wide"}
        toolbarStart={filtered.length > 0 ? filterBar : undefined}
        resetDeps={[
          filters.quick,
          filters.agentId,
          filters.query,
          filters.status,
          hkFilter,
        ]}
      />
    </div>
  );

  const detailPane = selectedAction ? (
    <ActionExecutionDetail key={selectedAction.id} action={selectedAction} hk={hkFilter} />
  ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ActionExecutionSplitLayout
        list={listPane}
        detail={detailPane}
        selectedActionId={selectedAction ? selectedAction.id : null}
        hk={hkFilter}
      />
    </div>
  );
}
