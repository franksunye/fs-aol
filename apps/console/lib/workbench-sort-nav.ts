import type { SuggestionSortKey } from "./suggestion-sorting";

/** 写入 URL 的 sort 参数；默认滞留最久时省略 sort */
export function nextSortSearchParams(
  current: URLSearchParams,
  key: SuggestionSortKey
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  next.delete("key");
  next.delete("round");
  next.delete("view");
  next.delete("panel");

  if (key === "stale") next.delete("sort");
  else if (key === "latest") next.set("sort", "latest");
  else next.set("sort", key);

  return next;
}
