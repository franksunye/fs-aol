#!/usr/bin/env node
/**
 * Import env vars into Turso/sqlite runtime_config (v0.4.2).
 * Run from apps/console:
 *   AOL_CONFIG_ENCRYPTION_KEY=... LIBSQL_URL=... node scripts/migrate-env-to-runtime-config.mjs [--dry-run]
 */
import { createClient } from "@libsql/client";
import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");
const dryRun = process.argv.includes("--dry-run");

const tables = JSON.parse(
  readFileSync(join(root, "contracts/tables.json"), "utf8")
);
const prefix = process.env.AOL_TABLE_PREFIX ?? tables.defaultPrefix;
const RUNTIME = `${prefix}${tables.runtimeConfig}`;
const REVISIONS = `${prefix}${tables.runtimeConfigRevisions}`;

function envBool(name, fallback) {
  const v = (process.env[name] ?? "").trim().toLowerCase();
  if (!v) return fallback;
  return ["1", "true", "yes", "on"].includes(v);
}

function parseKey(raw) {
  const s = (raw ?? "").trim();
  if (!s) throw new Error("AOL_CONFIG_ENCRYPTION_KEY required");
  try {
    const key = Buffer.from(s, "base64");
    if (key.length === 32) return key;
  } catch {
    /* hex fallback */
  }
  if (s.length === 64) return Buffer.from(s, "hex");
  throw new Error("AOL_CONFIG_ENCRYPTION_KEY must be base64 32 bytes or hex 64");
}

function encryptSecrets(secrets, key) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(secrets), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, tag]).toString("base64"),
    nonce: nonce.toString("base64"),
  };
}

function maskSecrets(secrets) {
  const out = {};
  for (const [k, v] of Object.entries(secrets)) {
    if (!v) out[k] = "";
    else if (v.length <= 6) out[k] = "***";
    else out[k] = `${v.slice(0, 3)}…${v.slice(-3)}`;
  }
  return out;
}

const config = {
  dry_run: envBool("DRY_RUN", true),
  fsm_source: (process.env.FSM_SOURCE ?? "mongo").toLowerCase(),
  fsm_mongo_db: process.env.FSM_MONGO_DB ?? "xlinkdemo",
  fsm_time_field: process.env.FSM_TIME_FIELD ?? "updateTime",
  lookback_hours: Number(process.env.FSM_LOOKBACK_HOURS ?? 24),
  fsm_batch_limit: Number(process.env.FSM_BATCH_LIMIT ?? 50),
  fsm_max_age_days: Number(process.env.FSM_MAX_AGE_DAYS ?? 14),
  fsm_stale_days: Number(process.env.FSM_STALE_DAYS ?? 0),
  fsm_event_statuses: process.env.FSM_EVENT_STATUSES ?? "206",
  pilot_housekeepers: process.env.FSM_PILOT_HOUSEKEEPERS ?? "",
  pilot_housekeeper_ids: process.env.FSM_PILOT_HOUSEKEEPER_IDS ?? "",
  wecom_webhook_map: process.env.WECOM_WEBHOOK_MAP ?? "",
  llm_provider: (process.env.LLM_PROVIDER ?? "hunyuan").toLowerCase(),
  llm_model: process.env.LLM_MODEL ?? "",
  llm_base_url: process.env.LLM_BASE_URL ?? "",
  agent_mode: (process.env.AGENT_MODE ?? "oneshot").toLowerCase(),
  console_base_url: (process.env.CONSOLE_BASE_URL ?? "").replace(/\/$/, ""),
  reanalyze_enabled: envBool("REANALYZE_ENABLED", true),
  reanalyze_interval_days: Number(process.env.REANALYZE_INTERVAL_DAYS ?? 3),
  reanalyze_stale_step_days: Number(process.env.REANALYZE_STALE_STEP_DAYS ?? 7),
  reanalyze_max_per_run: Number(process.env.REANALYZE_MAX_PER_RUN ?? 10),
  reanalyze_push: envBool("REANALYZE_PUSH", true),
  reanalyze_push_on_same_priority: envBool("REANALYZE_PUSH_ON_SAME_PRIORITY", false),
};

const secrets = {
  fsm_mongo_url: process.env.FSM_MONGO_URL ?? "",
  hunyuan_api_key: process.env.HUNYUAN_API_KEY ?? "",
  llm_api_key: process.env.LLM_API_KEY ?? "",
  wecom_webhook: process.env.WECOM_WEBHOOK ?? "",
  wecom_corp_id: process.env.WECOM_CORP_ID ?? "",
  wecom_agent_id: process.env.WECOM_AGENT_ID ?? "",
  wecom_agent_secret: process.env.WECOM_AGENT_SECRET ?? "",
};

const key = parseKey(process.env.AOL_CONFIG_ENCRYPTION_KEY);
const { ciphertext, nonce } = encryptSecrets(secrets, key);
const now = new Date().toISOString();
const scope = "follow_up";
const version = 1;

console.log("[migrate] scope:", scope);
console.log("[migrate] config:", JSON.stringify(config, null, 2));
console.log("[migrate] secrets (masked):", maskSecrets(secrets));

if (dryRun) {
  console.log("[migrate] dry-run OK");
  process.exit(0);
}

const url =
  process.env.LIBSQL_URL ?? `file:${join(root, "data/agent_loop_tracking.db")}`;
const authToken = process.env.LIBSQL_AUTH_TOKEN;
const db = createClient(authToken ? { url, authToken } : { url });

await db.execute({
  sql: `CREATE TABLE IF NOT EXISTS ${RUNTIME} (
    scope TEXT PRIMARY KEY,
    config_json TEXT NOT NULL,
    secrets_ciphertext TEXT NOT NULL,
    secrets_nonce TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  )`,
});
await db.execute({
  sql: `CREATE TABLE IF NOT EXISTS ${REVISIONS} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    version INTEGER NOT NULL,
    config_json TEXT NOT NULL,
    secrets_ciphertext TEXT NOT NULL,
    secrets_nonce TEXT NOT NULL,
    change_summary TEXT,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  )`,
});
await db.execute({
  sql: `CREATE INDEX IF NOT EXISTS idx_${REVISIONS}_scope ON ${REVISIONS}(scope, version)`,
});

const configJson = JSON.stringify(config);
await db.execute({
  sql: `INSERT INTO ${RUNTIME} (scope, config_json, secrets_ciphertext, secrets_nonce, version, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(scope) DO UPDATE SET
          config_json=excluded.config_json,
          secrets_ciphertext=excluded.secrets_ciphertext,
          secrets_nonce=excluded.secrets_nonce,
          version=excluded.version,
          updated_at=excluded.updated_at,
          updated_by=excluded.updated_by`,
  args: [scope, configJson, ciphertext, nonce, version, now, "migrate-env"],
});
await db.execute({
  sql: `INSERT INTO ${REVISIONS} (scope, version, config_json, secrets_ciphertext, secrets_nonce, change_summary, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
    scope,
    version,
    configJson,
    ciphertext,
    nonce,
    "Initial import from env",
    now,
    "migrate-env",
  ],
});

console.log("[migrate] OK version=1");
