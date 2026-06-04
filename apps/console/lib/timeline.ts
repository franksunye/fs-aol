import { db, ensureSchema, TABLE_TIMELINE } from "./db";

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

export interface QuoteLinePayload {
  repairParts: string;
  constructionLocation: string;
  partDescription: string;
  packageNames: string;
  warrantyLabel: string;
  maintainArea: string;
  amountYuan: string;
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
      partDescription: str(o.partDescription) || "—",
      packageNames: str(o.packageNames) || "—",
      warrantyLabel: str(o.warrantyLabel) || "—",
      maintainArea: str(o.maintainArea) || "—",
      amountYuan: str(o.amountYuan) || "—",
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
    return {
      id: Number(row.id),
      workOrderId: str(row.work_order_id),
      dedupeKey: str(row.dedupe_key),
      lane: str(row.lane) as TimelineEvent["lane"],
      kind,
      at: str(row.at),
      atMs: Number(row.at_ms ?? 0),
      title: str(row.title),
      summary: str(row.summary),
      refId: str(row.ref_id),
      survey: kind === "survey" ? parseSurveyPayload(payload) : null,
      appointment:
        kind === "appointment" ? parseAppointmentPayload(payload) : null,
      quote: kind === "quote" ? parseQuotePayload(payload) : null,
    };
  });
}
