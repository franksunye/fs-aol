import {
  encodeKey,
  INBOX_TAB_LABELS,
  inboxTabFromSearchParams,
  parseInboxBucket,
  type InboxBucket,
} from "./labels";

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

export function suggestionDetailHref(
  dedupeKey: string,
  ctx: WorkbenchListContext = {}
): string {
  const base = `/suggestions/${encodeKey(dedupeKey)}`;
  const q = new URLSearchParams();
  appendListContextQuery(q, ctx);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
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
