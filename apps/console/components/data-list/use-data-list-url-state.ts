"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { dataListParamKey } from "./data-list-url-scopes";
import {
  parseDataListOrder,
  parseDataListPage,
  parseDataListPageSize,
  type DataListPageSize,
  type DataListSortOrder,
} from "./data-list-types";
import type { DataListUrlScope } from "./data-list-url-scopes";

export type DataListUrlState<TSort extends string = string> = {
  page: number;
  pageSize: DataListPageSize;
  sort: TSort;
  order: DataListSortOrder;
};

export function useDataListUrlState<TSort extends string>({
  scope,
  defaultPageSize = 20,
  defaultSort,
  defaultOrder = "desc",
  parseSort,
  resetDeps = [],
}: {
  /** Namespace list params per surface (inbox vs execution). */
  scope?: DataListUrlScope;
  defaultPageSize?: DataListPageSize;
  defaultSort: TSort;
  defaultOrder?: DataListSortOrder;
  parseSort: (raw: string | null) => TSort;
  /** When any value changes, page resets to 1 */
  resetDeps?: readonly unknown[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const pageKey = dataListParamKey(scope, "page");
  const pageSizeKey = dataListParamKey(scope, "pageSize");
  const sortKey = dataListParamKey(scope, "sort");
  const orderKey = dataListParamKey(scope, "order");

  const state = useMemo<DataListUrlState<TSort>>(() => {
    const sortRaw = sp.get(sortKey);
    return {
      page: parseDataListPage(sp.get(pageKey)),
      pageSize: parseDataListPageSize(
        sp.get(pageSizeKey),
        defaultPageSize
      ),
      sort: sortRaw ? parseSort(sortRaw) : defaultSort,
      order: parseDataListOrder(sp.get(orderKey), defaultOrder),
    };
  }, [
    sp,
    pageKey,
    pageSizeKey,
    sortKey,
    orderKey,
    defaultPageSize,
    defaultSort,
    defaultOrder,
    parseSort,
  ]);

  const resetKey = JSON.stringify(resetDeps);
  const prevResetKey = useRef(resetKey);

  useEffect(() => {
    if (prevResetKey.current === resetKey) return;
    prevResetKey.current = resetKey;
    if (state.page === 1) return;

    const next = new URLSearchParams(sp.toString());
    next.delete(pageKey);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [resetKey, state.page, sp, pathname, router, pageKey]);

  const pushParams = useCallback(
    (mutate: (q: URLSearchParams) => void) => {
      const next = new URLSearchParams(sp.toString());
      mutate(next);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, sp]
  );

  const setPage = useCallback(
    (page: number) => {
      pushParams((q) => {
        if (page <= 1) q.delete(pageKey);
        else q.set(pageKey, String(page));
      });
    },
    [pushParams, pageKey]
  );

  const setPageSize = useCallback(
    (pageSize: DataListPageSize) => {
      pushParams((q) => {
        q.delete(pageKey);
        if (pageSize === defaultPageSize) q.delete(pageSizeKey);
        else q.set(pageSizeKey, String(pageSize));
      });
    },
    [pushParams, pageKey, pageSizeKey, defaultPageSize]
  );

  const setSort = useCallback(
    (sort: TSort, order?: DataListSortOrder) => {
      pushParams((q) => {
        q.delete(pageKey);
        q.delete("key");
        q.delete("round");
        q.delete("view");
        q.delete("panel");

        if (sort === defaultSort) q.delete(sortKey);
        else q.set(sortKey, sort);

        const nextOrder = order ?? state.order;
        if (nextOrder === defaultOrder) q.delete(orderKey);
        else q.set(orderKey, nextOrder);
      });
    },
    [
      pushParams,
      pageKey,
      sortKey,
      orderKey,
      defaultSort,
      defaultOrder,
      state.order,
    ]
  );

  const toggleSort = useCallback(
    (sort: TSort) => {
      if (state.sort === sort) {
        const nextOrder: DataListSortOrder =
          state.order === "desc" ? "asc" : "desc";
        setSort(sort, nextOrder);
      } else {
        setSort(sort, "desc");
      }
    },
    [setSort, state.sort, state.order]
  );

  return {
    ...state,
    setPage,
    setPageSize,
    setSort,
    toggleSort,
  };
}
