import { parseClosedLoopFilter } from "./execution-status";
import type { InboxBucket } from "./labels";
import { parseInboxBucket } from "./labels";

/** Action 中心顶栏视图 */
export type ActionCenterView = InboxBucket | "execution";

export const ACTION_CENTER_TITLE = "Action中心";

export const ACTION_CENTER_VIEW_LABELS: Record<ActionCenterView, string> = {
  active: "待审核",
  execution: "待执行",
  closed: "已闭环",
  archived: "存档",
};

export const ACTION_CENTER_TAB_ORDER: ActionCenterView[] = [
  "active",
  "execution",
  "closed",
  "archived",
];

export const ACTION_CENTER_SUBTITLE =
  "统一查看 Agent 生成的建议、Action 分发状态与业务反馈。";

export function actionCenterViewFromSearchParams(sp: {
  tab?: string;
  cfilter?: string;
}): ActionCenterView {
  const t = sp.tab?.trim();
  if (t === "execution") return t;
  if (t === "archived") return "archived";
  if (t === "closed" && sp.cfilter?.trim() === "archived") return "archived";
  return parseInboxBucket(t) ?? "active";
}

/** 已闭环 Tab 下根据筛选决定查询哪个收件箱桶 */
export function inboxBucketForActionCenterView(
  view: ActionCenterView,
  cfilter?: string | null
): InboxBucket | null {
  if (view === "active") return "active";
  if (view === "archived") return "archived";
  if (view === "closed") return "closed";
  return null;
}

export function isInboxDataView(
  view: ActionCenterView
): view is InboxBucket {
  return view === "active" || view === "closed" || view === "archived";
}

export function isActionCenterPlaceholderView(_view: ActionCenterView): boolean {
  return false;
}
