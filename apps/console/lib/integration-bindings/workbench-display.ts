import { resolveStaleDays } from "@/lib/compute-stale-days";
import { parseFactQuoteAmountYuan } from "@/lib/parse-fact-quote";
import { formatYuanCompact } from "@/lib/format-yuan";
import { formatWorkOrderRef } from "@/lib/work-order-ref";
import type { BindingOverridesJson } from "@/lib/runtime-config/types";
import type { SuggestionRow } from "@/lib/tracking/types";
import type {
  IntegrationBinding,
  MergedWorkbenchDisplay,
  WorkbenchDisplaySpec,
  WorkbenchFacetSpec,
} from "./types";

export type ResolvedFacet = { label: string; value: string };

export function bindingOverrideKey(binding: {
  id: string;
  version: string;
}): string {
  return `${binding.id}@${binding.version}`;
}

export function getWorkbenchDisplayFromBinding(
  binding: IntegrationBinding
): WorkbenchDisplaySpec | null {
  const obj =
    binding.objects.find((o) => o.workbench_display) ?? binding.objects[0];
  return obj?.workbench_display ?? null;
}

function contextColumnFromSpec(spec: WorkbenchDisplaySpec): {
  catalog: WorkbenchFacetSpec[];
  defaultEnabled: string[];
} {
  const ctx = spec.context_column;
  const catalog =
    ctx?.facet_catalog ?? spec.facet_catalog ?? [];
  const defaultEnabled =
    ctx?.default_enabled ??
    spec.default_enabled ??
    catalog.map((f) => f.id);
  return { catalog, defaultEnabled };
}

export function mergeWorkbenchDisplay(
  binding: IntegrationBinding,
  overrides?: BindingOverridesJson | null
): MergedWorkbenchDisplay | null {
  const spec = getWorkbenchDisplayFromBinding(binding);
  if (!spec) return null;

  const key = bindingOverrideKey(binding);
  const enabledFromOverride =
    overrides?.[key]?.workbench_display?.enabled_facets;
  const { catalog, defaultEnabled } = contextColumnFromSpec(spec);
  const enabledFacetIds = (
    enabledFromOverride !== undefined ? enabledFromOverride : defaultEnabled
  ).filter((id) => catalog.some((f) => f.id === id));

  return {
    bindingKey: key,
    relatedObject: {
      idFields: spec.related_object?.id_fields ?? ["order_num", "work_order_id"],
      typeLabel:
        spec.related_object?.type_label ??
        binding.objects[0]?.canonical.label ??
        "对象",
      disambiguateWithWorkOrderId:
        spec.related_object?.disambiguate_with_work_order_id ?? false,
    },
    sourceSystem: spec.source_system ?? {
      id: binding.ingestion.system_name,
      label: binding.display_name,
    },
    contextColumn: {
      facetCatalog: catalog,
      enabledFacetIds,
    },
  };
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function resolveFacetValue(
  facet: WorkbenchFacetSpec,
  row: SuggestionRow
): string | null {
  const { resolver } = facet;
  switch (resolver.kind) {
    case "quote_amount_yuan": {
      const fromFact = parseFactQuoteAmountYuan(row.liveVerdict ?? "");
      if (fromFact != null) return formatYuanCompact(fromFact);
      return null;
    }
    case "stale_days_state_at": {
      const days = resolveStaleDays(row);
      return days != null && days > 0 ? `${days} 天` : null;
    }
    case "suggestion_path": {
      const raw = getByPath(row.suggestion, resolver.path);
      if (raw == null || raw === "") return null;
      if (resolver.format === "currency_cny") {
        const n = Number(String(raw).replace(/,/g, ""));
        return Number.isFinite(n) && n > 0 ? formatYuanCompact(n) : String(raw);
      }
      return String(raw);
    }
    case "row_field": {
      if (resolver.field === "order_num") return row.orderNum || null;
      if (resolver.field === "work_order_id") return row.workOrderId || null;
      if (resolver.field === "city") return row.city || null;
      const meta = row as SuggestionRow & { metadata?: Record<string, unknown> };
      const fromMeta = meta.metadata?.[resolver.field];
      if (fromMeta != null && fromMeta !== "") return String(fromMeta);
      return null;
    }
    default:
      return null;
  }
}

export function resolveContextFacets(
  merged: MergedWorkbenchDisplay,
  row: SuggestionRow
): ResolvedFacet[] {
  const { facetCatalog, enabledFacetIds } = merged.contextColumn;
  const byId = new Map(facetCatalog.map((f) => [f.id, f]));
  const out: ResolvedFacet[] = [];
  for (const id of enabledFacetIds) {
    const facet = byId.get(id);
    if (!facet) continue;
    const value = resolveFacetValue(facet, row);
    if (!value) continue;
    out.push({ label: facet.label, value });
  }
  return out;
}

/** @deprecated 使用 resolveContextFacets */
export const resolveFacets = resolveContextFacets;

export function resolveRelatedObjectId(
  merged: MergedWorkbenchDisplay,
  row: SuggestionRow
): string {
  if (merged.relatedObject.disambiguateWithWorkOrderId) {
    return formatWorkOrderRef(row);
  }
  for (const field of merged.relatedObject.idFields) {
    if (field === "order_num" && row.orderNum?.trim()) {
      return row.orderNum.trim();
    }
    if (field === "work_order_id" && row.workOrderId?.trim()) {
      return row.workOrderId.trim();
    }
  }
  return row.orderNum?.trim() || row.workOrderId?.trim() || "—";
}

export function resolveRelatedObject(
  merged: MergedWorkbenchDisplay,
  row: SuggestionRow
): { id: string; type: string } {
  return {
    id: resolveRelatedObjectId(merged, row),
    type: merged.relatedObject.typeLabel,
  };
}

export function resolveContextColumn(
  merged: MergedWorkbenchDisplay,
  row: SuggestionRow
): ResolvedFacet[] {
  return resolveContextFacets(merged, row);
}

export const WORKBENCH_FACET_SAMPLE_ROW: SuggestionRow = {
  dedupeKey: "sample",
  workOrderId: "wo-sample",
  orderNum: "GD2026064004",
  eventType: "quoted_unsigned",
  housekeeperId: "hk1",
  city: "深圳",
  status: "206",
  processedAt: new Date().toISOString(),
  stateAt: new Date(Date.now() - 12 * 86_400_000).toISOString().slice(0, 19),
  inboxBucket: "active",
  outcome: null,
  blocker: null,
  archiveReason: "",
  reconciledAt: null,
  mongoStatus: "",
  liveVerdict: "已正式报价 40653元（屋面）→ 可推进签约",
  analyzedStaleDays: null,
  suggestion: {
    原因摘要: "样例",
    优先级: "中",
    情况判断: {
      报价状态: "已正式报价未签约",
      金额与方案: "40653元；X5-P-热施工",
    },
    跟进方案: { 主行动: "电话回访客户" },
  },
};

export function resolverKindLabel(kind: WorkbenchFacetSpec["resolver"]["kind"]): string {
  switch (kind) {
    case "quote_amount_yuan":
      return "从 live_verdict 业务查证解析金额（Fact Plane）";
    case "stale_days_state_at":
      return "由工单 state_at（Mongo updateTime）现算滞留天数";
    case "suggestion_path":
      return "建议 JSON 字段路径";
    case "row_field":
      return "收件箱行字段";
    default:
      return kind;
  }
}
