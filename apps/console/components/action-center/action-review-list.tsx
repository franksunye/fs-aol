"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { WorkItem } from "@/lib/operator-model";
import {
  parseActionReviewSortKey,
  type ActionReviewSortKey,
} from "@/lib/action-review-sorting";
import type { ActionReviewListContext } from "@/lib/action-center-nav";
import { suggestionDetailHref } from "@/lib/action-center-nav";
import {
  DataListDensityToggle,
  DataListFrame,
  DataListPagination,
  DataListToolbar,
  dataListParamKey,
  paginateItems,
  useDataListDensity,
  useDataListUrlState,
  type DataListLayout,
} from "@/components/data-list";
import { ActionReviewListKeyboard } from "./action-review-list-keyboard";
import { ActionReviewTable } from "./action-review-table";

export function ActionReviewList({
  items,
  listContext,
  selectedKey,
  sortKey: serverSortKey,
  layout = "wide",
}: {
  items: WorkItem[];
  listContext?: ActionReviewListContext;
  selectedKey: string | null;
  sortKey: ActionReviewSortKey;
  layout?: DataListLayout;
}) {
  const sp = useSearchParams();
  const { density, setDensity } = useDataListDensity();

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

  const { pageItems, total, pageCount } = useMemo(
    () => paginateItems(orderedItems, page, pageSize),
    [orderedItems, page, pageSize]
  );

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
              end={
                <DataListDensityToggle
                  density={density}
                  onDensityChange={setDensity}
                />
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
            density={density}
          />
        </DataListFrame>
      )}
    </ActionReviewListKeyboard>
  );
}
