import { db, TABLE_LOGS } from "./db";

const INBOX_COLUMNS: { name: string; ddl: string }[] = [
  { name: "inbox_bucket", ddl: "TEXT" },
  { name: "archive_reason", ddl: "TEXT" },
  { name: "reconciled_at", ddl: "TEXT" },
  { name: "mongo_status", ddl: "TEXT" },
  { name: "live_verdict", ddl: "TEXT" },
];

let migrateReady: Promise<void> | undefined;

/** 幂等补齐 follow_up_logs 收件箱列（与 Python TrackingStore 迁移一致）。 */
export function migrateInboxColumns(): Promise<void> {
  if (!migrateReady) {
    migrateReady = (async () => {
      const info = await db.execute(`PRAGMA table_info(${TABLE_LOGS})`);
      const existing = new Set(
        (info.rows as { name?: string }[]).map((r) => String(r.name ?? ""))
      );
      for (const col of INBOX_COLUMNS) {
        if (existing.has(col.name)) continue;
        await db.execute(
          `ALTER TABLE ${TABLE_LOGS} ADD COLUMN ${col.name} ${col.ddl}`
        );
      }
    })();
  }
  return migrateReady;
}
