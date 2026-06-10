"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DATA_LIST_URL_PARAMS,
  parseDataListOrder,
  parseDataListPage,
  parseDataListPageSize,
  type DataListPageSize,
  type DataListSortOrder,
} from "./data-list-types";

export type DataListUrlState<TSort extends string = string> = {
  page: number;
  pageSize: DataListPageSize;
  sort: TSort;
  order: DataListSortOrder;
};

export function useDataListUrlState<TSort extends string>({
  defaultPageSize = 20,
  defaultSort,
  defaultOrder = "desc",
  parseSort,
  resetDeps = [],
}: {
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

  const state = useMemo<DataListUrlState<TSort>>(() => {
    const sortRaw = sp.get(DATA_LIST_URL_PARAMS.sort);
    return {
      page: parseDataListPage(sp.get(DATA_LIST_URL_PARAMS.page)),
      pageSize: parseDataListPageSize(
        sp.get(DATA_LIST_URL_PARAMS.pageSize),
        defaultPageSize
      ),
      sort: sortRaw ? parseSort(sortRaw) : defaultSort,
      order: parseDataListOrder(sp.get(DATA_LIST_URL_PARAMS.order), defaultOrder),
    };
  }, [sp, defaultPageSize, defaultSort, defaultOrder, parseSort]);

  const resetKey = JSON.stringify(resetDeps);
  const prevResetKey = useRef(resetKey);

  useEffect(() => {
    if (prevResetKey.current === resetKey) return;
    prevResetKey.current = resetKey;
    if (state.page === 1) return;

    const next = new URLSearchParams(sp.toString());
    next.delete(DATA_LIST_URL_PARAMS.page);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [resetKey, state.page, sp, pathname, router]);

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
        if (page <= 1) q.delete(DATA_LIST_URL_PARAMS.page);
        else q.set(DATA_LIST_URL_PARAMS.page, String(page));
      });
    },
    [pushParams]
  );

  const setPageSize = useCallback(
    (pageSize: DataListPageSize) => {
      pushParams((q) => {
        q.delete(DATA_LIST_URL_PARAMS.page);
        if (pageSize === defaultPageSize) q.delete(DATA_LIST_URL_PARAMS.pageSize);
        else q.set(DATA_LIST_URL_PARAMS.pageSize, String(pageSize));
      });
    },
    [pushParams, defaultPageSize]
  );

  const setSort = useCallback(
    (sort: TSort, order?: DataListSortOrder) => {
      pushParams((q) => {
        q.delete(DATA_LIST_URL_PARAMS.page);
        q.delete("key");
        q.delete("round");
        q.delete("view");
        q.delete("panel");

        if (sort === defaultSort) q.delete(DATA_LIST_URL_PARAMS.sort);
        else q.set(DATA_LIST_URL_PARAMS.sort, sort);

        const nextOrder = order ?? state.order;
        if (nextOrder === defaultOrder) q.delete(DATA_LIST_URL_PARAMS.order);
        else q.set(DATA_LIST_URL_PARAMS.order, nextOrder);
      });
    },
    [pushParams, defaultSort, defaultOrder, state.order]
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
