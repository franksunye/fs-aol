import {
  encodeKey,
  INBOX_TAB_LABELS,
  inboxTabFromSearchParams,
  parseInboxBucket,
  type InboxBucket,
} from "./labels";

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
}

export type WorkbenchListContext = {
  from?: InboxBucket;
  hk?: string;
  sort?: string;
  priority?: string;
};

export function workbenchListContextFromWorkbench(sp: {
  tab?: string;
  hk?: string;
  sort?: string;
  priority?: string;
}): WorkbenchListContext {
  const from = inboxTabFromSearchParams(sp);
  return {
    from: from === "active" ? undefined : from,
    hk: sp.hk?.trim() || undefined,
    sort: sp.sort?.trim() || undefined,
    priority: sp.priority?.trim() || undefined,
  };
}

function appendListContextQuery(q: URLSearchParams, ctx: WorkbenchListContext) {
  const from = ctx.from ?? "active";
  if (from !== "active") q.set("from", from);
  if (ctx.hk) q.set("hk", ctx.hk);
  if (from === "active") {
    if (ctx.sort) q.set("sort", ctx.sort);
    if (ctx.priority) q.set("priority", ctx.priority);
  }
}

export function workbenchHref(ctx: WorkbenchListContext = {}): string {
  const q = new URLSearchParams();
  const from = ctx.from ?? "active";
  if (from !== "active") q.set("tab", from);
  if (ctx.hk) q.set("hk", ctx.hk);
  if (from === "active") {
    if (ctx.sort) q.set("sort", ctx.sort);
    if (ctx.priority) q.set("priority", ctx.priority);
  }
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

function appendWorkbenchListQuery(q: URLSearchParams, ctx: WorkbenchListContext) {
  const from = ctx.from ?? "active";
  if (from !== "active") q.set("tab", from);
  if (ctx.hk) q.set("hk", ctx.hk);
  if (from === "active") {
    if (ctx.sort) q.set("sort", ctx.sort);
    if (ctx.priority) q.set("priority", ctx.priority);
  }
}

/** 工作台分栏：列表与详情同页，URL 用 ?key= 驱动（邮件客户端式） */
export function workbenchPaneHref(
  dedupeKey: string,
  ctx: WorkbenchListContext = {},
  extra?: Record<string, string | undefined>
): string {
  const q = new URLSearchParams();
  appendWorkbenchListQuery(q, ctx);
  q.set("key", encodeKey(dedupeKey));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return `/?${q.toString()}`;
}

export function workbenchPaneDetailHref(
  dedupeKey: string,
  ctx: WorkbenchListContext = {},
  extra?: Record<string, string | undefined>
): string {
  return workbenchPaneHref(dedupeKey, ctx, extra);
}

export function suggestionDetailHref(
  dedupeKey: string,
  ctx: WorkbenchListContext = {}
): string {
  return workbenchPaneHref(dedupeKey, ctx);
}

export function listContextFromDetailSearchParams(sp: {
  from?: string;
  hk?: string;
  sort?: string;
  priority?: string;
}): WorkbenchListContext {
  return {
    from: parseInboxBucket(sp.from),
    hk: sp.hk?.trim() || undefined,
    sort: sp.sort?.trim() || undefined,
    priority: sp.priority?.trim() || undefined,
  };
}

export function resolveWorkbenchBack(
  sp: { from?: string; hk?: string; sort?: string; priority?: string },
  fallbackBucket: InboxBucket
): { href: string; label: string } {
  const ctx = listContextFromDetailSearchParams(sp);
  const from = ctx.from ?? fallbackBucket;
  const href = workbenchHref({ ...ctx, from });
  const label =
    from === "active" ? "返回工作台" : `返回${INBOX_TAB_LABELS[from]}`;
  return { href, label };
}

export function detailHrefWithListContext(
  detailBase: string,
  ctx: WorkbenchListContext,
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
