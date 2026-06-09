import { db, ensureSchema, TABLE_TRACES } from "../db";
import type { TraceRow } from "./types";
import { mapTraceRow } from "./mappers";

export async function getTraceLite(
  workOrderId: string
): Promise<TraceRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT work_order_id, mode, model, status, error, latency_ms, total_tokens,
                 steps_json, parsed, created_at
          FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id DESC LIMIT 1`,
    args: [workOrderId],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapTraceRow(row, { includePrompts: false }) : null;
}

export async function getTrace(workOrderId: string): Promise<TraceRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id DESC LIMIT 1`,
    args: [workOrderId],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapTraceRow(row, { includePrompts: true }) : null;
}

export async function listTraces(
  workOrderId: string,
  opts?: { includePrompts?: boolean }
): Promise<TraceRow[]> {
  await ensureSchema();
  const includePrompts = opts?.includePrompts ?? true;
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id ASC`,
    args: [workOrderId],
  });
  const rows = res.rows as unknown as Record<string, unknown>[];
  return rows.map((row) => mapTraceRow(row, { includePrompts }));
}

export async function listTracesLite(workOrderId: string): Promise<TraceRow[]> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT id, work_order_id, mode, model, status, error, latency_ms, total_tokens,
                 steps_json, parsed, created_at
          FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id ASC`,
    args: [workOrderId],
  });
  const rows = res.rows as unknown as Record<string, unknown>[];
  return rows.map((row) => mapTraceRow(row, { includePrompts: false }));
}
