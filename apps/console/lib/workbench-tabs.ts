import type { InboxBucket } from "./labels";
import { parseInboxBucket } from "./labels";

/** 工作台顶栏视图（含占位 Tab） */
export type WorkbenchView =
  | InboxBucket
  | "actions"
  | "calendar";

export const WORKBENCH_VIEW_LABELS: Record<WorkbenchView, string> = {
  active: "待处理",
  actions: "我的行动",
  calendar: "日历",
  closed: "已处理",
  archived: "归档",
};

export const WORKBENCH_TAB_ORDER: WorkbenchView[] = [
  "active",
  "actions",
  "calendar",
  "closed",
  "archived",
];

export function workbenchViewFromSearchParams(sp: {
  tab?: string;
}): WorkbenchView {
  const t = sp.tab?.trim();
  if (t === "actions" || t === "calendar") return t;
  return parseInboxBucket(t) ?? "active";
}

export function isInboxDataView(
  view: WorkbenchView
): view is InboxBucket {
  return view === "active" || view === "closed" || view === "archived";
}

export function isWorkbenchPlaceholderView(_view: WorkbenchView): boolean {
  return false;
}
