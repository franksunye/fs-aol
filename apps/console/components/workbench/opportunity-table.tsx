"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkItem } from "@/lib/operator-model";
import type { SuggestionSortKey } from "@/lib/suggestion-sorting";
import { followUpListBadges } from "@/lib/adapters/follow-up-list-badges";
import { cn } from "@/lib/utils";
import { BadgeStack } from "./badge-stack";
import { SortableColumnHead } from "./sortable-column-head";
import type { WorkbenchListContext } from "@/lib/workbench-nav";
import { suggestionDetailHref } from "@/lib/workbench-nav";

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

export function OpportunityTable({
  items,
  listContext,
  selectedKey,
  sortKey,
  keyboardIndex,
}: {
  items: WorkItem[];
  listContext?: WorkbenchListContext;
  selectedKey: string | null;
  sortKey: SuggestionSortKey;
  keyboardIndex?: number;
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border text-left">
            <SortableColumnHead
              label="级"
              columnSortKey="priority"
              activeSortKey={sortKey}
              className="w-10"
            />
            <th className="text-muted-foreground px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
              工单
            </th>
            <SortableColumnHead
              label="阶段"
              columnSortKey="stage"
              activeSortKey={sortKey}
              className="hidden sm:table-cell"
            />
            <SortableColumnHead
              label="金额"
              columnSortKey="quote"
              activeSortKey={sortKey}
              className="hidden md:table-cell"
            />
            <SortableColumnHead
              label="停滞"
              columnSortKey="stale"
              activeSortKey={sortKey}
              align="right"
            />
            <SortableColumnHead
              label="部位"
              columnSortKey="part"
              activeSortKey={sortKey}
              className="hidden md:table-cell"
            />
            <SortableColumnHead
              label="管家"
              columnSortKey="housekeeper"
              activeSortKey={sortKey}
              className="hidden lg:table-cell"
            />
            <SortableColumnHead
              label="时间"
              columnSortKey="latest"
              activeSortKey={sortKey}
              align="right"
            />
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const display = item.listDisplay;
            if (!display) return null;
            const href = suggestionDetailHref(item.id, listContext);
            const selected = selectedKey === item.id;
            const keyboardFocus = keyboardIndex === index;

            return (
              <tr
                key={item.id}
                data-work-item-id={item.id}
                data-work-item-href={href}
                role="option"
                aria-selected={selected}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0",
                  selected
                    ? "bg-sidebar-accent/80"
                    : keyboardFocus
                      ? "bg-muted/50"
                      : "hover:bg-muted/35"
                )}
              >
                <td className="px-2 py-2.5 align-middle">
                  <PriorityCell label={display.priorityLabel} />
                </td>
                <td className="max-w-[9rem] px-2 py-2.5 align-middle">
                  <Link
                    href={href}
                    scroll={false}
                    className={cn(
                      "block font-mono text-sm font-semibold hover:underline",
                      selected ? "text-primary" : "text-foreground"
                    )}
                    onFocus={() => router.prefetch(href)}
                  >
                    {display.subjectLabel}
                  </Link>
                  {item.summary ? (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {item.summary}
                    </p>
                  ) : null}
                  <div className="mt-1 sm:hidden">
                    <BadgeStack items={followUpListBadges(item)} max={2} size="xs" />
                  </div>
                </td>
                <td className="text-muted-foreground hidden px-2 py-2.5 align-middle text-xs sm:table-cell">
                  {display.stageLabel}
                </td>
                <td className="hidden px-2 py-2.5 align-middle text-xs md:table-cell">
                  {display.quoteBadge ? (
                    <span className="font-medium text-violet-700 tabular-nums">
                      {display.quoteBadge}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="text-muted-foreground px-2 py-2.5 text-right align-middle text-xs tabular-nums">
                  {display.staleDays != null ? `${display.staleDays}d` : "—"}
                </td>
                <td
                  className="text-muted-foreground hidden max-w-[5.5rem] truncate px-2 py-2.5 align-middle text-xs md:table-cell"
                  title={display.partLabel !== "—" ? display.partLabel : undefined}
                >
                  {display.partLabel}
                </td>
                <td
                  className="hidden max-w-[5rem] truncate px-2 py-2.5 align-middle text-xs lg:table-cell"
                  title={display.assigneeLabel !== "—" ? display.assigneeLabel : undefined}
                >
                  {display.assigneeLabel}
                </td>
                <td className="text-muted-foreground px-2 py-2.5 text-right align-middle font-mono text-[11px] tabular-nums">
                  {display.timestamp.replace(/^建议\s*/, "")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
