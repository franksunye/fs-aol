import { db, ensureSchema, TABLE_TIMELINE } from "./db";
import { loadBinding } from "./integration-bindings/load";

const FSM_STATUS_LABELS =
  loadBinding("xlink-fsm").code_tables.status_to_task_type ?? {};

function fsmStatusLabel(code: string): string {
  return FSM_STATUS_LABELS[code] ?? `状态${code}`;
}

/** 历史 timeline_events 可能仍含引擎旧文案「Mongo status 204」等。 */
export function formatTimelineSummary(summary: string): string {
  if (!summary.includes("Mongo status")) return summary;
  return summary.replace(/Mongo status (\d+)/g, (_, code: string) =>
    `当前状态：${fsmStatusLabel(code)}`
  );
}

export interface TimelineFormField {
  label: string;
  value: string;
}

export interface TimelineImage {
  url: string;
  name: string;
}

export interface SurveyPayload {
  fields: TimelineFormField[];
  images: TimelineImage[];
}

export interface AppointmentPayload {
  fields: TimelineFormField[];
}

export interface QuoteDetailItem {
  category: string;
  name: string;
  spec: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  note: string;
}

export interface QuotePackageDetail {
  name: string;
  skuCode: string;
  unit: string;
  quantity: string;
  packageAmount: string;
  items: QuoteDetailItem[];
}

export interface QuoteLinePayload {
  repairParts: string;
  constructionLocation: string;
  constructionSite: string;
  partDescription: string;
  packageNames: string;
  warrantyLabel: string;
  maintainArea: string;
  amountYuan: string;
  packages: QuotePackageDetail[];
  lineItems: QuoteDetailItem[];
}

export interface QuotePayload {
  fields: TimelineFormField[];
  lines: QuoteLinePayload[];
}

export interface TimelineEvent {
  id: number;
  workOrderId: string;
  dedupeKey: string;
  lane: "business" | "agent";
  kind: string;
  at: string;
  atMs: number;
  title: string;
  summary: string;
  refId: string;
  survey: SurveyPayload | null;
  appointment: AppointmentPayload | null;
  quote: QuotePayload | null;
  /** Agent 分析轮次（1-based），来自 timeline payload */
  traceRound: number | null;
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function parseFields(raw: unknown): TimelineFormField[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      label: str(o.label) || "—",
      value: str(o.value) || "—",
    };
  });
}

function parseImages(raw: unknown): TimelineImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const url = str(o.url).trim();
      if (!url) return null;
      return { url, name: str(o.name).trim() };
    })
    .filter((x): x is TimelineImage => x != null);
}

function parseQuoteDetailItems(raw: unknown): QuoteDetailItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      category: str(o.category) || "—",
      name: str(o.name) || "—",
      spec: str(o.spec) || "—",
      quantity: str(o.quantity) || "—",
      unit: str(o.unit) || "—",
      unitPrice: str(o.unitPrice) || "—",
      amount: str(o.amount) || "—",
      note: str(o.note) || "—",
    };
  });
}

function parseQuotePackages(raw: unknown): QuotePackageDetail[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      name: str(o.name) || "方案套餐",
      skuCode: str(o.skuCode) || "—",
      unit: str(o.unit) || "—",
      quantity: str(o.quantity) || "—",
      packageAmount: str(o.packageAmount) || "—",
      items: parseQuoteDetailItems(o.items),
    };
  });
}

function parseQuoteLines(raw: unknown): QuoteLinePayload[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      repairParts: str(o.repairParts) || "—",
      constructionLocation: str(o.constructionLocation) || "—",
      constructionSite: str(o.constructionSite) || "—",
      partDescription: str(o.partDescription) || "—",
      packageNames: str(o.packageNames) || "—",
      warrantyLabel: str(o.warrantyLabel) || "—",
      maintainArea: str(o.maintainArea) || "—",
      amountYuan: str(o.amountYuan) || "—",
      packages: parseQuotePackages(o.packages),
      lineItems: parseQuoteDetailItems(o.lineItems),
    };
  });
}

function parsePayloadJson(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseSurveyPayload(raw: unknown): SurveyPayload | null {
  const obj = parsePayloadJson(raw);
  if (!obj) return null;
  return {
    fields: parseFields(obj.fields),
    images: parseImages(obj.images),
  };
}

function parseAppointmentPayload(raw: unknown): AppointmentPayload | null {
  const obj = parsePayloadJson(raw);
  if (!obj) return null;
  return { fields: parseFields(obj.fields) };
}

function parseQuotePayload(raw: unknown): QuotePayload | null {
  const obj = parsePayloadJson(raw);
  if (!obj) return null;
  return {
    fields: parseFields(obj.fields),
    lines: parseQuoteLines(obj.lines),
  };
}

export async function getTimelineEvents(
  workOrderId: string
): Promise<TimelineEvent[]> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT id, work_order_id, dedupe_key, lane, kind, at, at_ms, title, summary, ref_id, payload_json
          FROM ${TABLE_TIMELINE} WHERE work_order_id = ? ORDER BY at_ms DESC`,
    args: [workOrderId],
  });
  const rows = res.rows as unknown as Record<string, unknown>[];
  return rows.map((row) => {
    const kind = str(row.kind);
    const payload = row.payload_json;
    const payloadObj = parsePayloadJson(payload);
    const traceRoundRaw = payloadObj?.trace_round;
    const traceRound =
      traceRoundRaw != null && String(traceRoundRaw).trim() !== ""
        ? Number(traceRoundRaw)
        : null;
    return {
      id: Number(row.id),
      workOrderId: str(row.work_order_id),
      dedupeKey: str(row.dedupe_key),
      lane: str(row.lane) as TimelineEvent["lane"],
      kind,
      at: str(row.at),
      atMs: Number(row.at_ms ?? 0),
      title: str(row.title),
      summary: formatTimelineSummary(str(row.summary)),
      refId: str(row.ref_id),
      survey: kind === "survey" ? parseSurveyPayload(payload) : null,
      appointment:
        kind === "appointment" ? parseAppointmentPayload(payload) : null,
      quote: kind === "quote" ? parseQuotePayload(payload) : null,
      traceRound:
        traceRound != null && Number.isFinite(traceRound) && traceRound > 0
          ? traceRound
          : null,
    };
  });
}
