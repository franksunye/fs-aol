import type { ActionReviewSortKey } from "./action-review-sorting";

/** 写入 URL 的 sort 参数；默认按时间时省略 sort */
export function nextSortSearchParams(
  current: URLSearchParams,
  key: ActionReviewSortKey
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  next.delete("key");
  next.delete("round");
  next.delete("view");
  next.delete("panel");

  if (key === "latest") next.delete("sort");
  else next.set("sort", key);

  return next;
}
