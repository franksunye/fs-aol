#!/usr/bin/env node
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

const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 20);
const url = process.env.LIBSQL_URL ?? `file:${join(root, "data/agent_loop_tracking.db")}`;
const authToken = process.env.LIBSQL_AUTH_TOKEN;
const db = createClient(authToken ? { url, authToken } : { url });

async function main() {
  const sample = await db.execute({
    sql: `SELECT l.dedupe_key, l.inbox_bucket, o.decision,
                 (SELECT COUNT(*) FROM ${TRACES} t WHERE t.work_order_id = l.work_order_id) AS trace_count,
                 (SELECT COUNT(*) FROM ${ACTIONS} a WHERE a.dedupe_key = l.dedupe_key) AS action_count
          FROM ${LOGS} l
          LEFT JOIN (
            SELECT dedupe_key, decision FROM ${OUTCOMES} o2
            INNER JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${OUTCOMES} GROUP BY dedupe_key) x
              ON o2.id = x.mid
          ) o ON o.dedupe_key = l.dedupe_key
          ORDER BY RANDOM()
          LIMIT ?`,
    args: [limit],
  });

  let ok = 0;
  let fail = 0;
  for (const row of sample.rows) {
    const key = row.dedupe_key ?? row[0];
    const traces = Number(row.trace_count ?? row[3] ?? 0);
    const actions = Number(row.action_count ?? row[4] ?? 0);
    const decision = row.decision ?? row[2];
    const bucket = row.inbox_bucket ?? row[1] ?? "active";
    const needsAction = decision === "approved" || decision === "modified";
    const pass = traces > 0 && (!needsAction || actions > 0 || bucket === "closed");
    if (pass) ok++;
    else fail++;
    console.log(
      `${pass ? "OK" : "FAIL"} ${key} bucket=${bucket} outcome=${decision ?? "—"} traces=${traces} actions=${actions}`
    );
  }
  console.log(`\n=== ${ok}/${sample.rows.length} passed ===`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
