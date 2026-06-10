import { DATA_LIST_URL_PARAMS } from "./data-list-types";

/** Per-list URL namespaces so inbox sort does not leak into execution tab. */
export type DataListUrlScope = "inbox" | "execution" | "runs" | "quality";

const SCOPED_PARAM_KEYS: Record<
  Exclude<DataListUrlScope, "inbox">,
  Record<keyof typeof DATA_LIST_URL_PARAMS, string>
> = {
  execution: {
    page: "ep",
    pageSize: "eps",
    sort: "es",
    order: "eo",
  },
  runs: {
    page: "rp",
    pageSize: "rps",
    sort: "rs",
    order: "ro",
  },
  quality: {
    page: "qp",
    pageSize: "qps",
    sort: "qs",
    order: "qo",
  },
};

export function dataListParamKey(
  scope: DataListUrlScope | undefined,
  key: keyof typeof DATA_LIST_URL_PARAMS
): string {
  if (scope && scope !== "inbox") return SCOPED_PARAM_KEYS[scope][key];
  return DATA_LIST_URL_PARAMS[key];
}

export function stripInboxDataListParams(q: URLSearchParams) {
  q.delete(DATA_LIST_URL_PARAMS.page);
  q.delete(DATA_LIST_URL_PARAMS.pageSize);
  q.delete(DATA_LIST_URL_PARAMS.sort);
  q.delete(DATA_LIST_URL_PARAMS.order);
}

export function stripExecutionDataListParams(q: URLSearchParams) {
  for (const key of Object.values(SCOPED_PARAM_KEYS.execution)) {
    q.delete(key);
  }
}

export function stripRunsDataListParams(q: URLSearchParams) {
  for (const key of Object.values(SCOPED_PARAM_KEYS.runs)) {
    q.delete(key);
  }
}

export function stripQualityDataListParams(q: URLSearchParams) {
  for (const key of Object.values(SCOPED_PARAM_KEYS.quality)) {
    q.delete(key);
  }
}

export function stripDataListParamsForView(
  q: URLSearchParams,
  view: "inbox" | "execution" | "runs"
) {
  if (view === "inbox") {
    stripExecutionDataListParams(q);
    stripRunsDataListParams(q);
    stripQualityDataListParams(q);
  } else if (view === "execution") {
    stripInboxDataListParams(q);
    stripRunsDataListParams(q);
    stripQualityDataListParams(q);
  } else {
    stripInboxDataListParams(q);
    stripExecutionDataListParams(q);
    stripQualityDataListParams(q);
  }
}
