import { DATA_LIST_URL_PARAMS } from "./data-list-types";

/** Per-list URL namespaces so inbox sort does not leak into execution tab. */
export type DataListUrlScope = "inbox" | "execution";

const EXECUTION_SCOPE_KEYS = {
  page: "ep",
  pageSize: "eps",
  sort: "es",
  order: "eo",
} as const;

export function dataListParamKey(
  scope: DataListUrlScope | undefined,
  key: keyof typeof DATA_LIST_URL_PARAMS
): string {
  if (scope === "execution") return EXECUTION_SCOPE_KEYS[key];
  return DATA_LIST_URL_PARAMS[key];
}

export function stripInboxDataListParams(q: URLSearchParams) {
  q.delete(DATA_LIST_URL_PARAMS.page);
  q.delete(DATA_LIST_URL_PARAMS.pageSize);
  q.delete(DATA_LIST_URL_PARAMS.sort);
  q.delete(DATA_LIST_URL_PARAMS.order);
}

export function stripExecutionDataListParams(q: URLSearchParams) {
  for (const key of Object.values(EXECUTION_SCOPE_KEYS)) {
    q.delete(key);
  }
}

export function stripDataListParamsForView(
  q: URLSearchParams,
  view: "inbox" | "execution"
) {
  if (view === "inbox") stripExecutionDataListParams(q);
  else stripInboxDataListParams(q);
}
