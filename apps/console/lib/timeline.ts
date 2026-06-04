import { db, ensureSchema, TABLE_TIMELINE } from "./db";

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
  payload: Record<string, string> | null;
}

export interface SurveyPayload {
  surveyNum: string;
  partLabel: string;
  surveyTime: string;
  address: string;
  supervisorName: string;
  planeArea: string;
  squareMeter: string;
  memo: string;
  leakageCause: string;
  createTime: string;
  updateTime: string;
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function parsePayload(raw: unknown): Record<string, string> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
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
  return rows.map((row) => ({
    id: Number(row.id),
    workOrderId: str(row.work_order_id),
    dedupeKey: str(row.dedupe_key),
    lane: str(row.lane) as TimelineEvent["lane"],
    kind: str(row.kind),
    at: str(row.at),
    atMs: Number(row.at_ms ?? 0),
    title: str(row.title),
    summary: str(row.summary),
    refId: str(row.ref_id),
    payload: parsePayload(row.payload_json),
  }));
}
