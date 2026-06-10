"use client";

import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CALENDAR_AGENT_OPTIONS,
  CALENDAR_ASSIGNEE_OPTIONS,
  CALENDAR_PRIORITY_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
  formatMonthTitle,
  type CalendarFilters,
} from "@/lib/calendar-mock";

export type CalendarViewMode = "month" | "week" | "list";

const VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "month", label: "月" },
  { id: "week", label: "周" },
  { id: "list", label: "列表" },
];

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
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-background text-foreground hover:bg-muted/50 h-8 min-w-[7.5rem] cursor-pointer rounded-lg border px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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

export function CalendarToolbar({
  month,
  viewMode,
  filters,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewModeChange,
  onFiltersChange,
}: {
  month: Date;
  viewMode: CalendarViewMode;
  filters: CalendarFilters;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onFiltersChange: (patch: Partial<CalendarFilters>) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onPrevMonth}
            aria-label="上一月"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToday}
            className="min-w-[7.5rem] font-semibold"
          >
            {formatMonthTitle(month)}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onNextMonth}
            aria-label="下一月"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <div
          className="bg-muted/40 flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label="日历视图"
        >
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onViewModeChange(mode.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === mode.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Agent 筛选"
          value={filters.agentId}
          options={CALENDAR_AGENT_OPTIONS}
          onChange={(agentId) => onFiltersChange({ agentId })}
        />
        <FilterSelect
          label="优先级筛选"
          value={filters.priority}
          options={CALENDAR_PRIORITY_OPTIONS}
          onChange={(priority) => onFiltersChange({ priority })}
        />
        <FilterSelect
          label="状态筛选"
          value={filters.status}
          options={CALENDAR_STATUS_OPTIONS}
          onChange={(status) => onFiltersChange({ status })}
        />
        <FilterSelect
          label="负责人筛选"
          value={filters.assigneeId}
          options={CALENDAR_ASSIGNEE_OPTIONS}
          onChange={(assigneeId) => onFiltersChange({ assigneeId })}
        />
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-3.5" aria-hidden />
          更多筛选
        </Button>
      </div>
    </div>
  );
}
