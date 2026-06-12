import { db, ensureSchema, TABLE_ACTIONS, TABLE_OUTCOMES } from "./db";

export type GovernanceAuditRow = {
  id: number;
  dedupeKey: string;
  workOrderId: string;
  decision: string;
  operator: string;
  createdAt: string;
  actionStatus: string | null;
};

export async function loadFollowUpAuditFeed(
  limit = 20
): Promise<GovernanceAuditRow[]> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT o.id, o.dedupe_key, o.work_order_id, o.decision, o.operator, o.created_at,
                 a.status AS action_status
          FROM ${TABLE_OUTCOMES} o
          LEFT JOIN ${TABLE_ACTIONS} a ON a.id = (
            SELECT MAX(a2.id) FROM ${TABLE_ACTIONS} a2 WHERE a2.dedupe_key = o.dedupe_key
          )
          ORDER BY o.created_at DESC
          LIMIT ?`,
    args: [limit],
  });
  return (res.rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: Number(row.id ?? 0),
    dedupeKey: String(row.dedupe_key ?? ""),
    workOrderId: String(row.work_order_id ?? ""),
    decision: String(row.decision ?? ""),
    operator: String(row.operator ?? "—"),
    createdAt: String(row.created_at ?? ""),
    actionStatus: row.action_status != null ? String(row.action_status) : null,
  }));
}
