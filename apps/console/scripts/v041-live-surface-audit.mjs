#!/usr/bin/env node
/**
 * v0.4.1 live-surface audit (run from apps/console)
 *   node scripts/v041-live-surface-audit.mjs [--limit=20]
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");
const tables = JSON.parse(
  readFileSync(join(root, "contracts/tables.json"), "utf8")
);
const prefix = process.env.AOL_TABLE_PREFIX ?? tables.defaultPrefix;
const LOGS = `${prefix}${tables.logs}`;
const OUTCOMES = `${prefix}${tables.outcomes}`;
const TRACES = `${prefix}${tables.traces}`;
const ACTIONS = `${prefix}${tables.actions}`;
const ENGINE = `${prefix}${tables.engineSnapshots}`;

const limit = Number(
  process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 20
);
const url =
  process.env.LIBSQL_URL ?? `file:${join(root, "data/agent_loop_tracking.db")}`;
const authToken = process.env.LIBSQL_AUTH_TOKEN;
const db = createClient(authToken ? { url, authToken } : { url });

let failures = 0;

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  failures += 1;
}

async function main() {
  const dist = await db.execute({
    sql: `SELECT COALESCE(inbox_bucket, 'active') AS bucket, COUNT(*) AS c FROM ${LOGS} GROUP BY bucket`,
  });
  console.log("=== inbox_bucket distribution ===");
  for (const row of dist.rows) {
    console.log(`  ${row.bucket ?? row[0]}: ${row.c ?? row[1]}`);
  }

  let engineRunAt = null;
  try {
    const snap = await db.execute({
      sql: `SELECT run_at FROM ${ENGINE} ORDER BY run_at DESC LIMIT 1`,
    });
    if (snap.rows.length) {
      engineRunAt = snap.rows[0].run_at ?? snap.rows[0][0];
      console.log(`\n=== engine_runtime_snapshot ===`);
      console.log(`  latest run_at: ${engineRunAt}`);
    } else {
      console.log(`\n=== engine_runtime_snapshot: empty (run cron once) ===`);
    }
  } catch {
    console.log(`\n=== engine_runtime_snapshot: table missing ===`);
  }

  const sample = await db.execute({
    sql: `SELECT l.dedupe_key, l.work_order_id, l.inbox_bucket,
                 o.decision AS outcome_decision,
                 (SELECT COUNT(*) FROM ${TRACES} t WHERE t.work_order_id = l.work_order_id) AS trace_count,
                 (SELECT COUNT(*) FROM ${ACTIONS} a WHERE a.dedupe_key = l.dedupe_key) AS action_count
          FROM ${LOGS} l
          LEFT JOIN (
            SELECT o2.dedupe_key, o2.decision FROM ${OUTCOMES} o2
            INNER JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${OUTCOMES} GROUP BY dedupe_key) x
              ON o2.id = x.mid
          ) o ON o.dedupe_key = l.dedupe_key
          ORDER BY l.processed_at DESC
          LIMIT ?`,
    args: [limit],
  });

  console.log(`\n=== traceability sample (latest ${limit}) ===`);
  for (const row of sample.rows) {
    const key = row.dedupe_key ?? row[0];
    const wo = row.work_order_id ?? row[1];
    const bucket = row.inbox_bucket ?? row[2] ?? "active";
    const decision = row.outcome_decision ?? row[3] ?? "—";
    const traces = Number(row.trace_count ?? row[4] ?? 0);
    const actions = Number(row.action_count ?? row[5] ?? 0);
    console.log(
      `  ${key} | bucket=${bucket} | outcome=${decision} | traces=${traces} | actions=${actions}`
    );
    if (traces < 1) fail(`${key}: missing trace`);
    if (bucket === "execution" && actions < 1) fail(`${key}: execution without action`);
    if (bucket === "closed" && decision === "approved" && actions < 1) {
      fail(`${key}: approved closed without action`);
    }
    if (!wo) fail(`${key}: missing work_order_id`);
  }

  if (failures > 0) {
    console.log(`\n=== audit: ${failures} issue(s) ===`);
    process.exit(1);
  }
  console.log(`\n=== audit: OK ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
