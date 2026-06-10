"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataStateBadge } from "@/components/data-state-badge";
import { cn } from "@/lib/utils";
import { agentDetailHref } from "@/lib/agents-nav";
import {
  formatCost,
  formatDuration,
  formatErrorRetry,
  type MockRun,
} from "@/lib/runs-mock";
import { runDetailHref } from "@/lib/runs-nav";
import {
  parseRunSortKey,
  sortRuns,
  type RunSortKey,
} from "@/lib/runs-sorting";
import {
  DataListColumnSettings,
  DataListDensityToggle,
  DataListFrame,
  DataListPagination,
  DataListSortableHead,
  DataListStaticHead,
  DataListTable,
  DataListToolbar,
  paginateItems,
  useDataListColumnPreferences,
  useDataListDensity,
  useDataListUrlState,
  DATA_LIST_TABLE_IDS,
  RUNS_COLUMN_PREFS,
  type DataListLayout,
  type DataListSortOrder,
} from "@/components/data-list";
import { RunStatusBadge } from "./run-status-badge";

export function RunsList({
  items,
  selectedId,
  hk,
  layout = "wide",
  resetDeps = [],
  className,
}: {
  items: MockRun[];
  selectedId: string | null;
  hk?: string;
  layout?: DataListLayout;
  resetDeps?: readonly unknown[];
  className?: string;
}) {
  const { density, setDensity } = useDataListDensity();
  const {
    hiddenIds,
    isColumnHidden,
    setColumnHidden,
    resetColumns,
  } = useDataListColumnPreferences(DATA_LIST_TABLE_IDS.runs, RUNS_COLUMN_PREFS);

  const parseSort = useCallback(
    (raw: string | null) => parseRunSortKey(raw),
    []
  );

  const {
    page,
    pageSize,
    sort,
    order,
    setPage,
    setPageSize,
    toggleSort,
  } = useDataListUrlState<RunSortKey>({
    scope: "runs",
    defaultSort: "started",
    parseSort,
    resetDeps,
  });

  const sortedItems = useMemo(
    () => sortRuns(items, sort, order),
    [items, sort, order]
  );

  const { pageItems, total, pageCount } = useMemo(
    () => paginateItems(sortedItems, page, pageSize),
    [sortedItems, page, pageSize]
  );

  const columns = useMemo(
    () =>
      buildColumns({
        sort,
        order,
        toggleSort,
        selectedId,
        hk,
      }),
    [sort, order, toggleSort, selectedId, hk]
  );

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm">
        当前筛选下暂无 Run 记录
      </div>
    );
  }

  return (
    <DataListFrame
      className={cn("min-h-[12rem] flex-1", className)}
      toolbar={
        <DataListToolbar
          start={
            hk ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <DataStateBadge state="live" className="h-4 px-1.5 text-[10px]" />
                <span>Follow-up trace ·</span>
                <Link href={agentDetailHref("follow-up")} className="hover:text-primary">
                  Agent 配置
                </Link>
              </span>
            ) : (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <DataStateBadge state="scenario" className="h-4 px-1.5 text-[10px]" />
                <span>多 Agent Run 样例</span>
              </span>
            )
          }
          end={
            <>
              <DataListColumnSettings
                columns={RUNS_COLUMN_PREFS}
                isColumnHidden={isColumnHidden}
                setColumnHidden={setColumnHidden}
                onReset={resetColumns}
              />
              <DataListDensityToggle
                density={density}
                onDensityChange={setDensity}
              />
            </>
          }
        />
      }
      footer={
        <DataListPagination
          page={page}
          pageSize={pageSize}
          total={total}
          pageCount={pageCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      }
    >
      <DataListTable
        data={pageItems}
        columns={columns}
        layout={layout}
        density={density}
        minWidth={layout === "narrow" ? 640 : 960}
        stickyTitleColumn={false}
        userHiddenColumnIds={hiddenIds}
        getRowId={(row) => row.id}
        getRowProps={(row) => {
          const active = row.original.id === selectedId;
          return {
            className: cn(active ? "bg-primary/5" : "hover:bg-muted/40"),
          };
        }}
      />
    </DataListFrame>
  );
}

function buildColumns({
  sort,
  order,
  toggleSort,
  selectedId,
  hk,
}: {
  sort: RunSortKey;
  order: DataListSortOrder;
  toggleSort: (key: RunSortKey) => void;
  selectedId: string | null;
  hk?: string;
}): ColumnDef<MockRun, unknown>[] {
  return [
    {
      id: "agent",
      header: () => (
        <DataListSortableHead
          label="Agent"
          active={sort === "agent"}
          order={order}
          onSort={() => toggleSort("agent")}
        />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const active = item.id === selectedId;
        return (
          <Link
            href={runDetailHref(item.id, hk)}
            scroll={false}
            className="group block min-w-0"
          >
            <span
              className={cn(
                "text-xs font-medium group-hover:text-primary",
                active && "text-primary"
              )}
            >
              {item.agentName}
            </span>
            <span className="text-muted-foreground mt-0.5 block font-mono text-[10px] tabular-nums">
              {item.id}
            </span>
          </Link>
        );
      },
    },
    {
      id: "trigger",
      header: () => <DataListStaticHead label="触发来源" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.triggerSource}</span>
      ),
    },
    {
      id: "started",
      header: () => (
        <DataListSortableHead
          label="开始时间"
          active={sort === "started"}
          order={order}
          onSort={() => toggleSort("started")}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {row.original.startedAt}
        </span>
      ),
    },
    {
      id: "status",
      header: () => (
        <DataListSortableHead
          label="运行状态"
          active={sort === "status"}
          order={order}
          onSort={() => toggleSort("status")}
        />
      ),
      cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
    },
    {
      id: "duration",
      header: () => (
        <DataListSortableHead
          label="耗时"
          active={sort === "duration"}
          order={order}
          onSort={() => toggleSort("duration")}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDuration(row.original.durationSec)}
        </span>
      ),
    },
    {
      id: "cost",
      header: () => (
        <DataListSortableHead
          label="模型成本"
          active={sort === "cost"}
          order={order}
          onSort={() => toggleSort("cost")}
        />
      ),
      cell: ({ row }) => (
        <>
          <div className="text-xs tabular-nums">{formatCost(row.original.costYuan)}</div>
          <div className="text-muted-foreground text-[10px]">
            {row.original.model === "heuristic" ? "Heuristic" : "LLM"}
          </div>
        </>
      ),
    },
    {
      id: "action",
      header: () => <DataListStaticHead label="是否生成 Action" />,
      cell: ({ row }) =>
        row.original.actionGenerated ? (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            已生成
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            未生成
          </Badge>
        ),
    },
    {
      id: "errors",
      header: () => <DataListStaticHead label="错误与重试" />,
      cell: ({ row }) => {
        const item = row.original;
        const errorRetry = formatErrorRetry(item);
        const hasIssue = item.errorCount > 0 || item.retryCount > 0;
        if (!hasIssue) {
          return <span className="text-muted-foreground text-xs">{errorRetry}</span>;
        }
        return (
          <div className="space-y-0.5">
            <span
              className={cn(
                "text-xs font-medium",
                item.status === "anomaly" ? "text-red-700" : "text-amber-800"
              )}
            >
              {errorRetry}
            </span>
            {item.errorSummary ? (
              <span className="text-muted-foreground block text-[10px] leading-snug">
                {item.errorSummary}
              </span>
            ) : null}
          </div>
        );
      },
    },
  ];
}
