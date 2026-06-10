"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { WorkItem } from "@/lib/operator-model";
import type { ActionReviewSortKey } from "@/lib/action-review-sorting";
import { followUpListBadges } from "@/lib/adapters/follow-up-list-badges";
import { cn } from "@/lib/utils";
import { BadgeStack } from "./badge-stack";
import type { ActionReviewListContext } from "@/lib/action-center-nav";
import { suggestionDetailHref } from "@/lib/action-center-nav";
import {
  DataListSortableHead,
  DataListStaticHead,
  DataListTable,
  type DataListDensity,
  type DataListLayout,
  type DataListSortOrder,
} from "@/components/data-list";

function PriorityCell({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[2rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
        label === "高" && "bg-red-50 text-red-600",
        label === "中" && "bg-amber-50 text-amber-700",
        label === "低" && "bg-emerald-50 text-emerald-700",
        label !== "高" && label !== "中" && label !== "低" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}

export function ActionReviewTable({
  items,
  listContext,
  selectedKey,
  sortKey,
  sortOrder,
  onToggleSort,
  keyboardIndex,
  layout = "wide",
  density = "comfortable",
}: {
  items: WorkItem[];
  listContext?: ActionReviewListContext;
  selectedKey: string | null;
  sortKey: ActionReviewSortKey;
  sortOrder: DataListSortOrder;
  onToggleSort: (key: ActionReviewSortKey) => void;
  keyboardIndex?: number;
  layout?: DataListLayout;
  density?: DataListDensity;
}) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<WorkItem, unknown>[]>(
    () => [
      {
        id: "priority",
        header: () => (
          <DataListSortableHead
            label="级"
            active={sortKey === "priority"}
            order={sortOrder}
            onSort={() => onToggleSort("priority")}
          />
        ),
        cell: ({ row }) => {
          const display = row.original.listDisplay;
          if (!display) return null;
          return <PriorityCell label={display.priorityLabel} />;
        },
      },
      {
        id: "title",
        header: () => <DataListStaticHead label="Action 标题" />,
        cell: ({ row }) => {
          const item = row.original;
          const display = item.listDisplay;
          if (!display) return null;
          const href = suggestionDetailHref(item.id, listContext);
          const selected = selectedKey === item.id;
          return (
            <>
              <Link
                href={href}
                scroll={false}
                className={cn(
                  "line-clamp-2 text-sm font-medium leading-snug hover:underline",
                  selected ? "text-primary" : "text-foreground"
                )}
                onFocus={() => router.prefetch(href)}
              >
                {display.title}
              </Link>
              {layout === "narrow" ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-muted-foreground truncate text-[11px]">
                    {display.sourceAgent.label}
                  </p>
                  <BadgeStack items={followUpListBadges(item)} max={3} size="xs" />
                </div>
              ) : (
                <div className="mt-1 sm:hidden">
                  <BadgeStack items={followUpListBadges(item)} max={3} size="xs" />
                </div>
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
            active={sortKey === "agent"}
            order={sortOrder}
            onSort={() => onToggleSort("agent")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-[7rem] truncate text-xs">
            {row.original.listDisplay?.sourceAgent.label}
          </span>
        ),
      },
      {
        id: "related",
        header: () => (
          <DataListSortableHead
            label="关联对象"
            active={sortKey === "related"}
            order={sortOrder}
            onSort={() => onToggleSort("related")}
          />
        ),
        cell: ({ row }) => {
          const related = row.original.listDisplay?.relatedObject;
          if (!related) return null;
          return (
            <>
              <p className="font-mono text-xs font-medium tabular-nums">
                {related.id}
              </p>
              <p className="text-muted-foreground text-[11px]">{related.type}</p>
            </>
          );
        },
      },
      {
        id: "sourceSystem",
        header: () => <DataListStaticHead label="来源系统" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.listDisplay?.sourceSystem.label}
          </span>
        ),
      },
      {
        id: "executor",
        header: () => (
          <DataListSortableHead
            label="执行人"
            active={sortKey === "housekeeper"}
            order={sortOrder}
            onSort={() => onToggleSort("housekeeper")}
          />
        ),
        cell: ({ row }) => {
          const label = row.original.listDisplay?.executorLabel ?? "—";
          return (
            <span
              className="max-w-[5rem] truncate text-xs"
              title={label !== "—" ? label : undefined}
            >
              {label}
            </span>
          );
        },
      },
      {
        id: "status",
        header: () => (
          <DataListSortableHead
            label="状态"
            active={sortKey === "disposition"}
            order={sortOrder}
            onSort={() => onToggleSort("disposition")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.listDisplay?.statusLabel}
          </span>
        ),
      },
      {
        id: "time",
        header: () => (
          <DataListSortableHead
            label="时间"
            active={sortKey === "latest"}
            order={sortOrder}
            align="right"
            onSort={() => onToggleSort("latest")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-right font-mono text-[11px] tabular-nums">
            {row.original.listDisplay?.timestamp.replace(/^建议\s*/, "")}
          </span>
        ),
      },
    ],
    [
      sortKey,
      sortOrder,
      onToggleSort,
      listContext,
      selectedKey,
      layout,
      router,
    ]
  );

  return (
    <div className="rounded-lg border border-border bg-card">
      <DataListTable
        data={items}
        columns={columns}
        layout={layout}
        density={density}
        minWidth={layout === "narrow" ? 520 : 880}
        getRowId={(row) => row.id}
        getRowProps={(row) => {
          const item = row.original;
          const href = suggestionDetailHref(item.id, listContext);
          const selected = selectedKey === item.id;
          const keyboardFocus = keyboardIndex === row.index;
          return {
            role: "option",
            "aria-selected": selected,
            "data-work-item-id": item.id,
            "data-work-item-href": href,
            className: cn(
              selected
                ? "bg-sidebar-accent/80"
                : keyboardFocus
                  ? "bg-muted/50"
                  : "hover:bg-muted/35"
            ),
          };
        }}
      />
    </div>
  );
}
