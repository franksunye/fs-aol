"use client";

import { useMemo, useState } from "react";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import {
  computeCalendarSummary,
  filterCalendarActions,
  getCalendarMockActions,
  resolveCalendarAssigneeFromHk,
  upcomingActions,
  type CalendarFilters,
} from "@/lib/calendar-mock";
import { CalendarSummaryCards } from "./calendar-summary-cards";
import { CalendarToolbar, type CalendarViewMode } from "./calendar-toolbar";
import { CalendarMonthGrid } from "./calendar-month-grid";
import { CalendarAgenda } from "./calendar-agenda";
import { CalendarRecentTable } from "./calendar-recent-table";
import { CalendarSidePanel } from "./calendar-side-panel";

export function CalendarView({
  hkFilter,
  pilots = [],
}: {
  hkFilter?: string;
  pilots?: PilotHousekeeper[];
}) {
  const today = useMemo(() => new Date(), []);
  const allActions = useMemo(() => getCalendarMockActions(), []);
  const hkAssignee = useMemo(
    () => resolveCalendarAssigneeFromHk(hkFilter, pilots),
    [hkFilter, pilots]
  );

  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [filters, setFilters] = useState<CalendarFilters>({
    agentId: "all",
    priority: "all",
    status: "all",
    assigneeId: "all",
  });

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      hk: hkAssignee,
      assigneeId:
        filters.assigneeId !== "all"
          ? filters.assigneeId
          : hkAssignee ?? "all",
    }),
    [filters, hkAssignee]
  );

  const filteredActions = useMemo(
    () => filterCalendarActions(allActions, effectiveFilters),
    [allActions, effectiveFilters]
  );

  const summary = useMemo(
    () => computeCalendarSummary(filteredActions),
    [filteredActions]
  );

  const recent = useMemo(
    () => upcomingActions(filteredActions, 7),
    [filteredActions]
  );

  const shiftMonth = (delta: number) => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <div className="pb-6">
      <CalendarSummaryCards summary={summary} />

      <CalendarToolbar
        month={month}
        viewMode={viewMode}
        filters={effectiveFilters}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        onToday={() => {
          const now = new Date();
          setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          setSelectedDate(now);
        }}
        onViewModeChange={setViewMode}
        onFiltersChange={(patch) =>
          setFilters((prev) => ({ ...prev, ...patch }))
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {viewMode === "month" ? (
            <CalendarMonthGrid
              month={month}
              selectedDate={selectedDate}
              today={today}
              actions={filteredActions}
              onSelectDate={handleSelectDate}
            />
          ) : (
            <CalendarAgenda
              actions={filteredActions}
              today={today}
              mode={viewMode}
              selectedDate={selectedDate}
            />
          )}
        </div>

        <CalendarSidePanel
          month={month}
          selectedDate={selectedDate}
          today={today}
          allActions={filteredActions}
          hk={hkFilter}
          onSelectDate={handleSelectDate}
        />
      </div>

      <CalendarRecentTable actions={recent} hk={hkFilter} />
    </div>
  );
}
