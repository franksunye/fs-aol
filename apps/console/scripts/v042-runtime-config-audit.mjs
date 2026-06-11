#!/usr/bin/env node
/**
 * v0.4.2 runtime-config-plane audit
 *   node scripts/v042-runtime-config-audit.mjs
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
const RUNTIME = `${prefix}${tables.runtimeConfig}`;
const ENGINE = `${prefix}${tables.engineSnapshots}`;

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
  const cfg = await db.execute({
    sql: `SELECT scope, version, updated_at, length(secrets_ciphertext) AS sc
          FROM ${RUNTIME} WHERE scope = 'follow_up'`,
  });
  if (!cfg.rows.length) {
    fail("runtime_config follow_up row missing");
  } else {
    const row = cfg.rows[0];
    const version = row.version ?? row[1];
    const sc = row.sc ?? row[3];
    console.log(`=== runtime_config ===`);
    console.log(`  version: ${version}`);
    console.log(`  updated_at: ${row.updated_at ?? row[2]}`);
    if (!sc || Number(sc) < 16) fail("secrets_ciphertext too short");
  }

  const snap = await db.execute({
    sql: `SELECT snapshot_json FROM ${ENGINE} ORDER BY run_at DESC LIMIT 1`,
  });
  if (cfg.rows.length && snap.rows.length) {
    const configRow = await db.execute({
      sql: `SELECT config_json FROM ${RUNTIME} WHERE scope = 'follow_up'`,
    });
    const cfgJson = JSON.parse(
      String(configRow.rows[0].config_json ?? configRow.rows[0][0])
    );
    const snapJson = JSON.parse(
      String(snap.rows[0].snapshot_json ?? snap.rows[0][0])
    );
    if (cfgJson.llm_provider !== snapJson.llm_provider) {
      console.log(
        `  note: config llm_provider=${cfgJson.llm_provider} snapshot=${snapJson.llm_provider} (cron may be pending)`
      );
    } else {
      console.log(`  snapshot llm_provider matches config`);
    }
  }

  if (failures) {
    console.error(`\n=== audit: FAILED (${failures}) ===`);
    process.exit(1);
  }
  console.log("\n=== audit: OK ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
