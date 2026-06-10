"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import type { DataListDensity, DataListLayout } from "./data-list-types";
import { isColumnVisibleInLayout } from "./data-list-column-visibility";

const DENSITY_CELL: Record<DataListDensity, string> = {
  compact: "px-2 py-1.5",
  comfortable: "px-2 py-2.5",
};

export function DataListTable<TData>({
  data,
  columns,
  layout = "wide",
  density = "comfortable",
  minWidth = 880,
  stickyTitleColumn = true,
  userHiddenColumnIds,
  getRowId,
  getRowProps,
  tableClassName,
}: {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  layout?: DataListLayout;
  density?: DataListDensity;
  minWidth?: number;
  stickyTitleColumn?: boolean;
  /** User-hidden columns from column settings (persisted). */
  userHiddenColumnIds?: Set<string>;
  getRowId?: (row: TData) => string;
  getRowProps?: (row: Row<TData>) => {
    className?: string;
    role?: string;
    "aria-selected"?: boolean;
    "data-work-item-id"?: string;
    "data-work-item-href"?: string;
  };
  tableClassName?: string;
}) {
  const visibleColumns = columns.filter((col) => {
    const id = col.id ?? (col as { accessorKey?: string }).accessorKey;
    if (!id) return true;
    const colId = String(id);
    if (userHiddenColumnIds?.has(colId)) return false;
    return isColumnVisibleInLayout(colId, layout);
  });

  const table = useReactTable({
    data,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const cellPad = DENSITY_CELL[density];
  const titleColumnId = "title";

  const headerCellClass = cn(
    "bg-muted text-muted-foreground border-border sticky top-0 z-10 border-b px-2 py-2 text-left text-[11px] font-semibold tracking-wide uppercase",
    "shadow-[0_1px_0_0_var(--border)]"
  );

  return (
    <table
      className={cn(
        "w-full border-separate border-spacing-0 text-sm",
        tableClassName
      )}
      style={minWidth > 0 ? { minWidth } : undefined}
    >
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const colId = header.column.id;
              const isTitle = stickyTitleColumn && colId === titleColumnId;
              const sortMeta = header.column.columnDef.meta as
                | { sortActive?: boolean; sortOrder?: "asc" | "desc" }
                | undefined;

              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={
                    sortMeta?.sortActive
                      ? sortMeta.sortOrder === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={cn(
                    headerCellClass,
                    isTitle && "left-0 z-30 shadow-[1px_0_0_0_var(--border)]"
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          const rowProps = getRowProps?.(row) ?? {};
          return (
            <tr
              key={row.id}
              {...rowProps}
              className={cn("transition-colors", rowProps.className)}
            >
              {row.getVisibleCells().map((cell) => {
                const colId = cell.column.id;
                const isTitle = stickyTitleColumn && colId === titleColumnId;
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      "border-border/60 align-middle border-b",
                      cellPad,
                      isTitle &&
                        "bg-background sticky left-0 z-[1] shadow-[1px_0_0_0_var(--border)]"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
