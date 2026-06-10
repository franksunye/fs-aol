"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { formatDateKey } from "@/lib/calendar-mock";
import {
  computeMyActionsSummary,
  filterMyActions,
  getMyActionsMockData,
  resolveMyActionsAssigneeFromHk,
  type MyAction,
  type MyActionQuickFilter,
  type MyActionsFilters as MyActionsFilterState,
} from "@/lib/my-actions-mock";
import { MyActionsSummaryCards } from "./my-actions-summary-cards";
import { MyActionsFilters } from "./my-actions-filters";
import { MyActionsList } from "./my-actions-list";
import {
  MyActionsDetail,
  MyActionsDetailEmpty,
} from "./my-actions-detail";
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
    }),
    [sp, hkAssignee]
  );

  const filtered = useMemo(
    () => filterMyActions(allActions, filters),
    [allActions, filters]
  );

  const summary = useMemo(
    () => computeMyActionsSummary(filtered),
    [filtered]
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
      overdue: base.filter((a) => a.status === "overdue").length,
      agent: base.length,
    };
  }, [allActions, filters]);

  const selectedId = sp.get("action")?.trim() || null;
  const selectedAction = useMemo(
    () => filtered.find((a) => a.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  const [localStatus, setLocalStatus] = useState<
    Record<string, MyAction["status"]>
  >({});

  const displayAction = selectedAction
    ? {
        ...selectedAction,
        status: localStatus[selectedAction.id] ?? selectedAction.status,
      }
    : null;

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      const q = new URLSearchParams(sp.toString());
      q.set("action", filtered[0].id);
      router.replace(`/?${q.toString()}`, { scroll: false });
    }
  }, [selectedId, filtered, sp, router]);

  useEffect(() => {
    if (selectedId && filtered.length > 0 && !selectedAction) {
      const q = new URLSearchParams(sp.toString());
      q.set("action", filtered[0].id);
      router.replace(`/?${q.toString()}`, { scroll: false });
    }
  }, [selectedId, filtered, selectedAction, sp, router]);

  const listPane = (
    <div className="px-3 py-3 lg:px-4 lg:py-4">
      <MyActionsSummaryCards summary={summary} />
      <MyActionsFilters hk={hkFilter} counts={quickCounts} filters={filters} />
      <MyActionsList
        items={filtered.map((item) => ({
          ...item,
          status: localStatus[item.id] ?? item.status,
        }))}
        selectedId={selectedId}
        hk={hkFilter}
      />
    </div>
  );

  const detailPane = displayAction ? (
    <MyActionsDetail
      key={displayAction.id}
      action={displayAction}
      hk={hkFilter}
      onStart={() =>
        setLocalStatus((prev) => ({
          ...prev,
          [displayAction.id]: "in_progress",
        }))
      }
    />
  ) : (
    <MyActionsDetailEmpty />
  );

  return (
    <MyActionsSplitLayout
      list={listPane}
      detail={detailPane}
      selectedActionId={displayAction ? displayAction.id : null}
      hk={hkFilter}
    />
  );
}
