"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { formatDateKey } from "@/lib/calendar-mock";
import type { ActionFlowStatus } from "@/lib/action-flow-status";
import {
  filterMyActions,
  getMyActionsMockData,
  resolveMyActionsAssigneeFromHk,
  type MyActionQuickFilter,
  type MyActionsFilters as MyActionsFilterState,
} from "@/lib/my-actions-mock";
import { MyActionsFilters } from "./my-actions-filters";
import { MyActionsList } from "./my-actions-list";
import { MyActionsDetail } from "./my-actions-detail";
import { MyActionsSplitLayout } from "./my-actions-split-layout";

function parseQuickFilter(value?: string | null): MyActionQuickFilter {
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
): ActionFlowStatus | "timeout_anomaly" | undefined {
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

export function MyActionsView({
  hkFilter,
  pilots = [],
}: {
  hkFilter?: string;
  pilots?: PilotHousekeeper[];
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const allActions = useMemo(() => getMyActionsMockData(), []);
  const hkAssignee = useMemo(
    () => resolveMyActionsAssigneeFromHk(hkFilter, pilots),
    [hkFilter, pilots]
  );

  const filters: MyActionsFilterState = useMemo(
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
    () => filterMyActions(allActions, filters),
    [allActions, filters]
  );

  const quickCounts = useMemo(() => {
    const today = formatDateKey(new Date());
    const base = filterMyActions(allActions, {
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

  const listPane = (
    <div className="px-3 py-3 lg:px-4 lg:py-4">
      <MyActionsFilters hk={hkFilter} counts={quickCounts} filters={filters} />
      <MyActionsList
        items={filtered}
        selectedId={selectedId}
        hk={hkFilter}
      />
    </div>
  );

  const detailPane = selectedAction ? (
    <MyActionsDetail key={selectedAction.id} action={selectedAction} hk={hkFilter} />
  ) : null;

  return (
    <MyActionsSplitLayout
      list={listPane}
      detail={detailPane}
      selectedActionId={selectedAction ? selectedAction.id : null}
      hk={hkFilter}
    />
  );
}
