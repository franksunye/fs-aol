import {
  encodeKey,
  INBOX_TAB_LABELS,
  parseInboxBucket,
  type InboxBucket,
} from "./labels";
import {
  inboxBucketForActionCenterView,
  actionCenterViewFromSearchParams,
} from "./action-center-tabs";

/** Action 中心首页，默认待审核 */
export function actionCenterHref(hk?: string): string {
  const q = new URLSearchParams();
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

/** 切换列表筛选/排序/收件箱时清除分栏选中态 */
export type DetailPanel = "activity" | "agent";

export function parseDetailPanel(
  panel?: string | null,
  legacyView?: string | null
): DetailPanel {
  if (panel === "activity") return "activity";
  if (panel === "agent") return "agent";
  if (legacyView === "feed") return "activity";
  return "agent";
}

export function stripPaneSelectionParams(q: URLSearchParams) {
  q.delete("key");
  q.delete("round");
  q.delete("view");
  q.delete("panel");
  q.delete("action");
  q.delete("q");
  q.delete("aquick");
  q.delete("aagent");
  q.delete("aq");
  q.delete("cfilter");
}

export type ActionReviewListContext = {
  from?: InboxBucket;
  hk?: string;
  sort?: string;
  priority?: string;
};

export function actionReviewListContext(sp: {
  tab?: string;
  hk?: string;
  sort?: string;
  priority?: string;
  cfilter?: string;
}): ActionReviewListContext {
  const view = actionCenterViewFromSearchParams(sp);
  const bucket = inboxBucketForActionCenterView(view, sp.cfilter);
  const from = bucket && bucket !== "active" ? bucket : undefined;
  return {
    from,
    hk: sp.hk?.trim() || undefined,
    sort: sp.sort?.trim() || undefined,
    priority: sp.priority?.trim() || undefined,
  };
}

function appendListContextQuery(q: URLSearchParams, ctx: ActionReviewListContext) {
  const from = ctx.from ?? "active";
  if (from !== "active") q.set("from", from);
  if (ctx.hk) q.set("hk", ctx.hk);
  if (from === "active") {
    if (ctx.sort) q.set("sort", ctx.sort);
    if (ctx.priority) q.set("priority", ctx.priority);
  }
}

export function actionCenterTabHref(ctx: ActionReviewListContext = {}): string {
  const q = new URLSearchParams();
  const from = ctx.from ?? "active";
  if (from === "archived") {
    q.set("tab", "archived");
  } else if (from === "closed") {
    q.set("tab", "closed");
  } else if (from !== "active") {
    q.set("tab", from);
  }
  if (ctx.hk) q.set("hk", ctx.hk);
  if (from === "active") {
    if (ctx.sort) q.set("sort", ctx.sort);
    if (ctx.priority) q.set("priority", ctx.priority);
  }
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

function appendActionCenterListQuery(q: URLSearchParams, ctx: ActionReviewListContext) {
  const from = ctx.from ?? "active";
  if (from === "archived") {
    q.set("tab", "archived");
  } else if (from === "closed") {
    q.set("tab", "closed");
  } else if (from !== "active") {
    q.set("tab", from);
  }
  if (ctx.hk) q.set("hk", ctx.hk);
  if (from === "active") {
    if (ctx.sort) q.set("sort", ctx.sort);
    if (ctx.priority) q.set("priority", ctx.priority);
  }
}

/** 工作台分栏：列表与详情同页，URL 用 ?key= 驱动（邮件客户端式） */
export function actionReviewPaneHref(
  dedupeKey: string,
  ctx: ActionReviewListContext = {},
  extra?: Record<string, string | undefined>
): string {
  const q = new URLSearchParams();
  appendActionCenterListQuery(q, ctx);
  q.set("key", encodeKey(dedupeKey));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return `/?${q.toString()}`;
}

export function actionReviewPaneDetailHref(
  dedupeKey: string,
  ctx: ActionReviewListContext = {},
  extra?: Record<string, string | undefined>
): string {
  return actionReviewPaneHref(dedupeKey, ctx, extra);
}

export function suggestionDetailHref(
  dedupeKey: string,
  ctx: ActionReviewListContext = {}
): string {
  return actionReviewPaneHref(dedupeKey, ctx);
}

export function listContextFromDetailSearchParams(sp: {
  from?: string;
  hk?: string;
  sort?: string;
  priority?: string;
}): ActionReviewListContext {
  return {
    from: parseInboxBucket(sp.from),
    hk: sp.hk?.trim() || undefined,
    sort: sp.sort?.trim() || undefined,
    priority: sp.priority?.trim() || undefined,
  };
}

export function resolveActionCenterBack(
  sp: {
    from?: string;
    hk?: string;
    sort?: string;
    priority?: string;
    tab?: string;
    cfilter?: string;
  },
  fallbackBucket: InboxBucket
): { href: string; label: string } {
  const ctx = sp.tab
    ? actionReviewListContext(sp)
    : listContextFromDetailSearchParams(sp);
  const from = ctx.from ?? fallbackBucket;
  const href = actionCenterTabHref({ ...ctx, from });
  const label =
    from === "active" ? "返回Action中心" : `返回${INBOX_TAB_LABELS[from]}`;
  return { href, label };
}

export function detailHrefWithListContext(
  detailBase: string,
  ctx: ActionReviewListContext,
  extra?: Record<string, string>
): string {
  const q = new URLSearchParams();
  appendListContextQuery(q, ctx);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  const s = q.toString();
  return s ? `${detailBase}?${s}` : detailBase;
}
