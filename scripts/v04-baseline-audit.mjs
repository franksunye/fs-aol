#!/usr/bin/env node
/**
 * v0.4 baseline audit: sample follow_up_logs and report bucket/outcome/trace distribution.
 * Usage: node scripts/v04-baseline-audit.mjs [--limit=20]
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const tables = JSON.parse(
  readFileSync(join(root, "contracts/tables.json"), "utf8")
);
const prefix = process.env.AOL_TABLE_PREFIX ?? tables.defaultPrefix;
const LOGS = `${prefix}${tables.logs}`;
const OUTCOMES = `${prefix}${tables.outcomes}`;
const TRACES = `${prefix}${tables.traces}`;
const ACTIONS = `${prefix}${tables.actions}`;

const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 20);
const url = process.env.LIBSQL_URL ?? `file:${join(root, "data/agent_loop_tracking.db")}`;
const authToken = process.env.LIBSQL_AUTH_TOKEN;
const db = createClient(authToken ? { url, authToken } : { url });

async function main() {
  const dist = await db.execute({
    sql: `SELECT COALESCE(inbox_bucket, 'active') AS bucket, COUNT(*) AS c FROM ${LOGS} GROUP BY bucket`,
  });
  console.log("=== inbox_bucket distribution ===");
  for (const row of dist.rows) {
    console.log(`  ${row.bucket ?? row[0]}: ${row.c ?? row[1]}`);
  }

  const outcomeDist = await db.execute({
    sql: `SELECT decision, COUNT(*) AS c FROM ${OUTCOMES} GROUP BY decision`,
  });
  console.log("\n=== outcome decision distribution ===");
  for (const row of outcomeDist.rows) {
    console.log(`  ${row.decision ?? row[0]}: ${row.c ?? row[1]}`);
  }

  const legacy = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${LOGS} l
          INNER JOIN (
            SELECT dedupe_key, MAX(id) AS mid FROM ${OUTCOMES} GROUP BY dedupe_key
          ) m ON l.dedupe_key = m.dedupe_key
          INNER JOIN ${OUTCOMES} o ON o.id = m.mid
          WHERE o.decision IN ('approved','modified') AND l.inbox_bucket = 'closed'`,
  });
  const legacyCount = Number(legacy.rows[0]?.c ?? legacy.rows[0]?.[0] ?? 0);
  console.log(`\n=== legacy_closed (approved/modified + closed): ${legacyCount} ===`);

  let actionsExists = true;
  try {
    await db.execute({ sql: `SELECT COUNT(*) AS c FROM ${ACTIONS}` });
  } catch {
    actionsExists = false;
  }
  console.log(`\n=== actions table: ${actionsExists ? "present" : "not yet migrated"} ===`);

  const sample = await db.execute({
    sql: `SELECT l.dedupe_key, l.work_order_id, l.inbox_bucket, l.archive_reason,
                 o.decision AS outcome_decision,
                 (SELECT COUNT(*) FROM ${TRACES} t WHERE t.work_order_id = l.work_order_id) AS trace_count
          FROM ${LOGS} l
          LEFT JOIN (
            SELECT dedupe_key, decision FROM ${OUTCOMES} o2
            INNER JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${OUTCOMES} GROUP BY dedupe_key) x
              ON o2.id = x.mid
          ) o ON o.dedupe_key = l.dedupe_key
          ORDER BY l.processed_at DESC
          LIMIT ?`,
    args: [limit],
  });

  console.log(`\n=== sample (latest ${limit}) ===`);
  for (const row of sample.rows) {
    const r = typeof row === "object" && !Array.isArray(row) ? row : {};
    const key = r.dedupe_key ?? row[0];
    const bucket = r.inbox_bucket ?? row[2] ?? "active";
    const decision = r.outcome_decision ?? row[4] ?? "—";
    const traces = r.trace_count ?? row[5] ?? 0;
    const legacyTag =
      ["approved", "modified"].includes(String(decision)) && bucket === "closed"
        ? " [legacy_closed]"
        : "";
    console.log(`  ${key} | bucket=${bucket} | outcome=${decision} | traces=${traces}${legacyTag}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
