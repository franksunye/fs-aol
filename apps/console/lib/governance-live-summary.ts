import { db, ensureSchema, TABLE_LOGS, TABLE_OUTCOMES } from "./db";

export type GovernanceLiveSummary = {
  activeInbox: number;
  closedInbox: number;
  outcomeCount: number;
};

export async function loadGovernanceLiveSummary(): Promise<GovernanceLiveSummary> {
  await ensureSchema();
  const [active, closed, outcomes] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(*) AS c FROM ${TABLE_LOGS} WHERE COALESCE(inbox_bucket,'active') = 'active'`,
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS c FROM ${TABLE_LOGS} WHERE inbox_bucket = 'closed'`,
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS c FROM ${TABLE_OUTCOMES}`,
    }),
  ]);
  const n = (row: (typeof active.rows)[0]) => {
    const r = row as Record<string, unknown>;
    return Number(r.c ?? r[0] ?? 0);
  };
  return {
    activeInbox: n(active.rows[0]),
    closedInbox: n(closed.rows[0]),
    outcomeCount: n(outcomes.rows[0]),
  };
}
