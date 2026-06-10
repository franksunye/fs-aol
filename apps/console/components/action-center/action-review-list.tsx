"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { WorkItem } from "@/lib/operator-model";
import {
  parseActionReviewSortKey,
  type ActionReviewSortKey,
} from "@/lib/action-review-sorting";
import type { ActionReviewListContext } from "@/lib/action-center-nav";
import { suggestionDetailHref } from "@/lib/action-center-nav";
import {
  ACTION_REVIEW_COLUMN_PREFS,
  DataListColumnSettings,
  DataListDensityToggle,
  DataListFrame,
  DataListPagination,
  DataListToolbar,
  dataListParamKey,
  paginateItems,
  useDataListColumnPreferences,
  useDataListDensity,
  useDataListUrlState,
  DATA_LIST_TABLE_IDS,
  type DataListLayout,
} from "@/components/data-list";
import { ActionReviewListKeyboard } from "./action-review-list-keyboard";
import { ActionReviewTable } from "./action-review-table";

export function ActionReviewList({
  items,
  totalCount,
  listContext,
  selectedKey,
  sortKey: serverSortKey,
  layout = "wide",
  toolbarSummary,
  toolbarStart,
}: {
  items: WorkItem[];
  /** When set, items are already the current page (server-side pagination). */
  totalCount?: number;
  listContext?: ActionReviewListContext;
  selectedKey: string | null;
  sortKey: ActionReviewSortKey;
  layout?: DataListLayout;
  /** Merged into toolbar left side, e.g. 「已归档 · 24 条」 */
  toolbarSummary?: string;
  /** Merged into toolbar left side, e.g. priority filter chips */
  toolbarStart?: ReactNode;
}) {
  const sp = useSearchParams();
  const { density, setDensity } = useDataListDensity();
  const effectiveDensity = layout === "narrow" ? "compact" : density;
  const {
    hiddenIds,
    isColumnHidden,
    setColumnHidden,
    resetColumns,
  } = useDataListColumnPreferences(
    DATA_LIST_TABLE_IDS.actionReview,
    ACTION_REVIEW_COLUMN_PREFS
  );

  const resetDeps = useMemo(
    () => [
      sp.get("tab"),
      sp.get("priority"),
      sp.get("q"),
      sp.get("cfilter"),
      sp.get("hk"),
    ],
    [sp]
  );

  const parseSort = useCallback(
    (raw: string | null) => parseActionReviewSortKey(raw),
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
  } = useDataListUrlState<ActionReviewSortKey>({
    scope: "inbox",
    defaultSort: serverSortKey,
    parseSort,
    resetDeps,
  });

  const sortParam = dataListParamKey("inbox", "sort");
  const effectiveSort = sp.get(sortParam) ? sort : serverSortKey;

  const orderedItems = useMemo(
    () => (order === "asc" ? [...items].reverse() : items),
    [items, order]
  );

  const { pageItems, total, pageCount } = useMemo(() => {
    if (totalCount != null) {
      const pageCount = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
      return { pageItems: orderedItems, total: totalCount, pageCount };
    }
    return paginateItems(orderedItems, page, pageSize);
  }, [orderedItems, page, pageSize, totalCount]);

  const itemHrefs = useMemo(
    () =>
      pageItems.map((item) => ({
        id: item.id,
        href: suggestionDetailHref(item.id, listContext),
      })),
    [pageItems, listContext]
  );

  return (
    <ActionReviewListKeyboard
      itemHrefs={itemHrefs}
      selectedKey={selectedKey}
      enabled={pageItems.length > 0}
    >
      {({ keyboardIndex }) => (
        <DataListFrame
          className="h-full"
          toolbar={
            <DataListToolbar
              start={
                toolbarStart || toolbarSummary ? (
                  <>
                    {toolbarStart}
                    {toolbarSummary ? (
                      <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                        {toolbarSummary}
                      </span>
                    ) : null}
                  </>
                ) : undefined
              }
              end={
                <>
                  <DataListColumnSettings
                    columns={ACTION_REVIEW_COLUMN_PREFS}
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
            total > 0 ? (
              <DataListPagination
                page={page}
                pageSize={pageSize}
                total={total}
                pageCount={pageCount}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null
          }
        >
          <ActionReviewTable
            items={pageItems}
            listContext={listContext}
            selectedKey={selectedKey}
            sortKey={effectiveSort}
            sortOrder={order}
            onToggleSort={toggleSort}
            keyboardIndex={keyboardIndex}
            layout={layout}
            density={effectiveDensity}
            userHiddenColumnIds={hiddenIds}
          />
        </DataListFrame>
      )}
    </ActionReviewListKeyboard>
  );
}
