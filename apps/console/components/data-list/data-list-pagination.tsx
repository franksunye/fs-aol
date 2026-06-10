"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DATA_LIST_PAGE_SIZES,
  type DataListPageSize,
} from "./data-list-types";

function pageWindow(current: number, total: number, size = 5): number[] {
  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function DataListPagination({
  page,
  pageSize,
  total,
  pageCount,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number;
  pageSize: DataListPageSize;
  total: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: DataListPageSize) => void;
  className?: string;
}) {
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pages = pageWindow(safePage, pageCount);

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-xs",
        className
      )}
    >
      <span className="tabular-nums">共 {total} 条</span>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="上一页"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          上一页
        </Button>

        <div className="flex items-center gap-0.5" role="group" aria-label="页码">
          {pages.map((p) => (
            <Button
              key={p}
              type="button"
              variant={p === safePage ? "secondary" : "ghost"}
              size="icon-xs"
              className="size-7 min-w-7 text-xs tabular-nums"
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="下一页"
        >
          下一页
          <ChevronRight className="size-3.5" aria-hidden />
        </Button>

        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v) as DataListPageSize)}
        >
          <SelectTrigger size="sm" className="h-7 min-w-[6.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {DATA_LIST_PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} 条/页
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
