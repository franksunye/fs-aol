export type DataListDensity = "compact" | "comfortable";

export type DataListLayout = "wide" | "narrow";

export const DATA_LIST_PAGE_SIZES = [10, 20, 50] as const;

export type DataListPageSize = (typeof DATA_LIST_PAGE_SIZES)[number];

export type DataListSortOrder = "asc" | "desc";

export const DATA_LIST_DENSITY_STORAGE_KEY = "aol_console_data_list_density";

export const DATA_LIST_URL_PARAMS = {
  page: "page",
  pageSize: "pageSize",
  sort: "sort",
  order: "order",
} as const;

export function parseDataListPageSize(
  raw: string | null | undefined,
  fallback: DataListPageSize = 20
): DataListPageSize {
  const n = Number(raw);
  if (n === 10 || n === 20 || n === 50) return n;
  return fallback;
}

export function parseDataListPage(
  raw: string | null | undefined,
  fallback = 1
): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function parseDataListOrder(
  raw: string | null | undefined,
  fallback: DataListSortOrder = "desc"
): DataListSortOrder {
  return raw === "asc" ? "asc" : fallback;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): { pageItems: T[]; total: number; pageCount: number } {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    total,
    pageCount,
  };
}
