import { db, ensureSchema, TABLE_ENGINE_SNAPSHOTS } from "../db";

export type EngineRuntimeSnapshot = {
  runAt: string;
  snapshot: Record<string, unknown>;
  runSummary: Record<string, unknown> | null;
};

function parseJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  try {
    return JSON.parse(String(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getLatestEngineRuntimeSnapshot(): Promise<EngineRuntimeSnapshot | null> {
  await ensureSchema();
  try {
    const res = await db.execute({
      sql: `SELECT run_at, snapshot_json, run_summary_json
            FROM ${TABLE_ENGINE_SNAPSHOTS}
            ORDER BY run_at DESC
            LIMIT 1`,
    });
    if (!res.rows.length) return null;
    const row = res.rows[0];
    const runAt = String(row.run_at ?? row[0] ?? "");
    const snapshot = parseJson(row.snapshot_json ?? row[1]);
    if (!snapshot) return null;
    return {
      runAt,
      snapshot,
      runSummary: parseJson(row.run_summary_json ?? row[2]),
    };
  } catch {
    return null;
  }
}
