"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  calendarPriorityLabel,
  WORK_ORDER_OBJECT_TYPE,
  XLINK_SOURCE_SYSTEM,
  type ActionEntityRef,
} from "@/lib/action-list-display";
import {
  formatDueLabel,
  executionActionHref,
  type ExecutionAction,
} from "@/lib/action-execution-mock";
import {
  parseExecutionSortKey,
  sortExecutionActions,
  type ExecutionSortKey,
} from "@/lib/action-execution-sorting";
import { terminalFeedbackDisplayState } from "@/lib/terminal-feedback-display";
import {
  DataListDensityToggle,
  DataListFrame,
  DataListPagination,
  DataListSortableHead,
  DataListStaticHead,
  DataListTable,
  DataListToolbar,
  PriorityBadge,
  TerminalFeedbackBadge,
  paginateItems,
  useDataListDensity,
  useDataListUrlState,
  type DataListLayout,
  type DataListSortOrder,
} from "@/components/data-list";
import { ExecutionStatusBadge } from "./execution-status-badge";

function executionSourceAgent(item: ExecutionAction): ActionEntityRef {
  return { id: item.agentId, label: item.sourceAgent };
}

function executionSourceSystem(item: ExecutionAction): ActionEntityRef {
  return item.sourceSystem ?? XLINK_SOURCE_SYSTEM;
}

export function ActionExecutionList({
  items,
  selectedId,
  hk,
  layout = "wide",
  resetDeps = [],
  className,
}: {
  items: ExecutionAction[];
  selectedId: string | null;
  hk?: string;
  layout?: DataListLayout;
  resetDeps?: readonly unknown[];
  className?: string;
}) {
  const router = useRouter();
  const { density, setDensity } = useDataListDensity();

  const parseSort = useCallback(
    (raw: string | null) => parseExecutionSortKey(raw),
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
  } = useDataListUrlState<ExecutionSortKey>({
    scope: "execution",
    defaultSort: "due",
    parseSort,
    resetDeps,
  });

  const sortedItems = useMemo(
    () => sortExecutionActions(items, sort, order),
    [items, sort, order]
  );

  const { pageItems, total, pageCount } = useMemo(
    () => paginateItems(sortedItems, page, pageSize),
    [sortedItems, page, pageSize]
  );

  const columns = useMemo<ColumnDef<ExecutionAction, unknown>[]>(
    () => buildColumns({
      sort,
      order,
      toggleSort,
      selectedId,
      hk,
      layout,
      router,
    }),
    [sort, order, toggleSort, selectedId, hk, layout, router]
  );

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm">
        当前筛选下暂无 Action
      </div>
    );
  }

  return (
    <DataListFrame
      className={cn("min-h-[12rem] flex-1", className)}
      toolbar={
        <DataListToolbar
          end={
            <DataListDensityToggle
              density={density}
              onDensityChange={setDensity}
            />
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
      <div
        className="rounded-xl border border-border bg-card"
        role="listbox"
        aria-label="待执行 Action 列表"
      >
        <DataListTable
          data={pageItems}
          columns={columns}
          layout={layout}
          density={density}
          minWidth={layout === "narrow" ? 600 : 1040}
          getRowId={(row) => row.id}
          getRowProps={(row) => {
            const item = row.original;
            const active = item.id === selectedId;
            return {
              role: "option",
              "aria-selected": active,
              className: cn(
                active ? "bg-primary/5" : "hover:bg-muted/35"
              ),
            };
          }}
        />
      </div>
    </DataListFrame>
  );
}

function buildColumns({
  sort,
  order,
  toggleSort,
  selectedId,
  hk,
  layout,
  router,
}: {
  sort: ExecutionSortKey;
  order: DataListSortOrder;
  toggleSort: (key: ExecutionSortKey) => void;
  selectedId: string | null;
  hk?: string;
  layout: DataListLayout;
  router: ReturnType<typeof useRouter>;
}): ColumnDef<ExecutionAction, unknown>[] {
  return [
    {
      id: "priority",
      header: () => (
        <DataListSortableHead
          label="级"
          active={sort === "priority"}
          order={order}
          onSort={() => toggleSort("priority")}
        />
      ),
      cell: ({ row }) => (
        <PriorityBadge label={calendarPriorityLabel(row.original.priority)} />
      ),
    },
    {
      id: "title",
      header: () => (
        <DataListSortableHead
          label="Action 标题"
          active={sort === "title"}
          order={order}
          onSort={() => toggleSort("title")}
        />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const Icon = item.icon;
        const active = item.id === selectedId;
        const href = executionActionHref(item.id, hk);
        const sourceAgent = executionSourceAgent(item);
        return (
          <>
            <Link
              href={href}
              scroll={false}
              className={cn(
                "flex min-w-0 items-start gap-2 hover:underline",
                active ? "text-primary" : "text-foreground"
              )}
              onFocus={() => router.prefetch(href)}
            >
              <span className="bg-primary/10 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
                {item.title}
              </span>
            </Link>
            {layout === "narrow" ? (
              <p className="text-muted-foreground mt-1 truncate text-[11px]">
                {sourceAgent.label} · {item.assignee}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 truncate text-[11px] sm:hidden">
                {sourceAgent.label}
              </p>
            )}
          </>
        );
      },
    },
    {
      id: "sourceAgent",
      header: () => (
        <DataListSortableHead
          label="来源 Agent"
          active={sort === "agent"}
          order={order}
          onSort={() => toggleSort("agent")}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[7rem] truncate text-xs">
          {executionSourceAgent(row.original).label}
        </span>
      ),
    },
    {
      id: "related",
      header: () => <DataListStaticHead label="关联对象" />,
      cell: ({ row }) => (
        <>
          <p className="font-mono text-xs font-medium tabular-nums">
            {row.original.opportunityId}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {WORK_ORDER_OBJECT_TYPE}
          </p>
        </>
      ),
    },
    {
      id: "sourceSystem",
      header: () => <DataListStaticHead label="来源系统" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {executionSourceSystem(row.original).label}
        </span>
      ),
    },
    {
      id: "executor",
      header: () => <DataListStaticHead label="执行人" />,
      cell: ({ row }) => (
        <span
          className="max-w-[5rem] truncate text-xs"
          title={row.original.assignee}
        >
          {row.original.assignee}
        </span>
      ),
    },
    {
      id: "due",
      header: () => (
        <DataListSortableHead
          label="截止时间"
          active={sort === "due"}
          order={order}
          align="right"
          onSort={() => toggleSort("due")}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-right text-xs tabular-nums">
          {formatDueLabel(row.original.dueDate, row.original.dueTime)}
        </span>
      ),
    },
    {
      id: "status",
      header: () => (
        <DataListSortableHead
          label="状态"
          active={sort === "status"}
          order={order}
          onSort={() => toggleSort("status")}
        />
      ),
      cell: ({ row }) => (
        <ExecutionStatusBadge status={row.original.status} />
      ),
    },
    {
      id: "terminalFeedback",
      header: () => (
        <DataListSortableHead
          label="终端反馈"
          active={sort === "feedback"}
          order={order}
          onSort={() => toggleSort("feedback")}
        />
      ),
      cell: ({ row }) => (
        <TerminalFeedbackBadge
          state={terminalFeedbackDisplayState(row.original)}
        />
      ),
    },
  ];
}
