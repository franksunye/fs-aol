import { parseClosedLoopFilter } from "./action-flow-status";
import type { InboxBucket } from "./labels";
import { parseInboxBucket } from "./labels";

/** Action 中心顶栏视图 */
export type WorkbenchView =
  | InboxBucket
  | "actions"
  | "calendar";

export const ACTION_CENTER_TITLE = "Action中心";

export const WORKBENCH_VIEW_LABELS: Record<WorkbenchView, string> = {
  active: "待审核",
  actions: "Action 流转",
  calendar: "日历",
  closed: "已闭环",
  archived: "存档",
};

export const WORKBENCH_TAB_ORDER: WorkbenchView[] = [
  "active",
  "actions",
  "calendar",
  "closed",
  "archived",
];

export const WORKBENCH_SUBTITLE =
  "统一查看 Agent 生成的建议、Action 分发状态与业务反馈。";

export const CALENDAR_SUBTITLE =
  "查看 Action 截止时间、Agent 计划与 SLA 风险。";

export function workbenchViewFromSearchParams(sp: {
  tab?: string;
  cfilter?: string;
}): WorkbenchView {
  const t = sp.tab?.trim();
  if (t === "actions" || t === "calendar") return t;
  if (t === "archived") return "archived";
  if (t === "closed" && sp.cfilter?.trim() === "archived") return "archived";
  return parseInboxBucket(t) ?? "active";
}

/** 已闭环 Tab 下根据筛选决定查询哪个收件箱桶 */
export function inboxBucketForWorkbenchView(
  view: WorkbenchView,
  cfilter?: string | null
): InboxBucket | null {
  if (view === "active") return "active";
  if (view === "archived") return "archived";
  if (view === "closed") return "closed";
  return null;
}

export function isInboxDataView(
  view: WorkbenchView
): view is InboxBucket {
  return view === "active" || view === "closed" || view === "archived";
}

export function isWorkbenchPlaceholderView(_view: WorkbenchView): boolean {
  return false;
}
