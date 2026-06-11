import {
  db,
  ensureSchema,
  TABLE_RUNTIME_CONFIG,
  TABLE_RUNTIME_CONFIG_REVISIONS,
} from "../db";
import { decryptSecrets, encryptSecrets, encryptionKey } from "./crypto";
import { defaultRuntimeConfig, emptySecrets } from "./defaults";
import { maskSecrets } from "./mask";
import {
  RUNTIME_SCOPE_FOLLOW_UP,
  type RuntimeConfigJson,
  type RuntimeConfigPublic,
  type RuntimeSecrets,
  SECRET_KEYS,
} from "./types";

export type { RuntimeConfigPublic } from "./types";

function rowVal<T>(row: Record<string, unknown>, key: string, idx: number): T {
  if (key in row) return row[key] as T;
  return row[idx] as T;
}

function parseRow(row: Record<string, unknown>) {
  return {
    scope: String(rowVal(row, "scope", 0)),
    config_json: String(rowVal(row, "config_json", 1)),
    secrets_ciphertext: String(rowVal(row, "secrets_ciphertext", 2)),
    secrets_nonce: String(rowVal(row, "secrets_nonce", 3)),
    version: Number(rowVal(row, "version", 4)),
    updated_at: String(rowVal(row, "updated_at", 5)),
    updated_by: rowVal<string | null>(row, "updated_by", 6) ?? null,
  };
}

export function isRuntimeEncryptionConfigured(): boolean {
  return Boolean(encryptionKey());
}

/** UI/bootstrap: key configured but Turso row missing → defaults (first save creates v1). */
export async function getRuntimeConfigForUi(
  scope = RUNTIME_SCOPE_FOLLOW_UP
): Promise<{ runtime: RuntimeConfigPublic; isBootstrap: boolean } | null> {
  if (!isRuntimeEncryptionConfigured()) return null;
  const existing = await getRuntimeConfig(scope);
  if (existing) return { runtime: existing, isBootstrap: false };
  return {
    isBootstrap: true,
    runtime: {
      scope,
      version: 0,
      updatedAt: "",
      updatedBy: null,
      config: defaultRuntimeConfig(),
      secretsMasked: maskSecrets(emptySecrets()),
    },
  };
}

export async function getRuntimeConfig(
  scope = RUNTIME_SCOPE_FOLLOW_UP
): Promise<RuntimeConfigPublic | null> {
  await ensureSchema();
  const key = encryptionKey();
  if (!key) return null;

  const res = await db.execute({
    sql: `SELECT scope, config_json, secrets_ciphertext, secrets_nonce, version, updated_at, updated_by
          FROM ${TABLE_RUNTIME_CONFIG} WHERE scope = ?`,
    args: [scope],
  });
  if (!res.rows.length) return null;
  const row = parseRow(res.rows[0] as Record<string, unknown>);
  const config = JSON.parse(row.config_json) as RuntimeConfigJson;
  const secrets = decryptSecrets(
    row.secrets_ciphertext,
    row.secrets_nonce,
    key
  );
  return {
    scope: row.scope,
    version: row.version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    config,
    secretsMasked: maskSecrets(secrets),
  };
}

export async function getRuntimeSecrets(
  scope = RUNTIME_SCOPE_FOLLOW_UP
): Promise<RuntimeSecrets | null> {
  await ensureSchema();
  const key = encryptionKey();
  if (!key) return null;
  const res = await db.execute({
    sql: `SELECT secrets_ciphertext, secrets_nonce FROM ${TABLE_RUNTIME_CONFIG} WHERE scope = ?`,
    args: [scope],
  });
  if (!res.rows.length) return null;
  const row = res.rows[0] as Record<string, unknown>;
  return decryptSecrets(
    String(row.secrets_ciphertext ?? row[0]),
    String(row.secrets_nonce ?? row[1]),
    key
  );
}

export async function saveRuntimeConfig(opts: {
  config?: Partial<RuntimeConfigJson>;
  secrets?: Partial<RuntimeSecrets>;
  updatedBy: string;
  changeSummary?: string;
  scope?: string;
}): Promise<RuntimeConfigPublic> {
  await ensureSchema();
  const key = encryptionKey();
  if (!key) {
    throw new Error("AOL_CONFIG_ENCRYPTION_KEY is not configured");
  }
  const scope = opts.scope ?? RUNTIME_SCOPE_FOLLOW_UP;
  const existing = await getRuntimeConfig(scope);
  const baseConfig = existing?.config ?? defaultRuntimeConfig();
  const mergedConfig: RuntimeConfigJson = {
    ...baseConfig,
    ...(opts.config ?? {}),
  };
  if (opts.config) validateConfig(mergedConfig);

  const prevSecrets =
    (await getRuntimeSecrets(scope)) ?? emptySecrets();
  const mergedSecrets: RuntimeSecrets = { ...prevSecrets };
  if (opts.secrets) {
    for (const k of SECRET_KEYS) {
      if (opts.secrets[k] !== undefined && opts.secrets[k] !== "") {
        mergedSecrets[k] = opts.secrets[k]!;
      }
    }
  }

  const version = (existing?.version ?? 0) + 1;
  const now = new Date().toISOString();
  const { ciphertext, nonce } = encryptSecrets(mergedSecrets, key);
  const configJson = JSON.stringify(mergedConfig);

  await db.execute({
    sql: `INSERT INTO ${TABLE_RUNTIME_CONFIG}
          (scope, config_json, secrets_ciphertext, secrets_nonce, version, updated_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(scope) DO UPDATE SET
            config_json=excluded.config_json,
            secrets_ciphertext=excluded.secrets_ciphertext,
            secrets_nonce=excluded.secrets_nonce,
            version=excluded.version,
            updated_at=excluded.updated_at,
            updated_by=excluded.updated_by`,
    args: [scope, configJson, ciphertext, nonce, version, now, opts.updatedBy],
  });
  await db.execute({
    sql: `INSERT INTO ${TABLE_RUNTIME_CONFIG_REVISIONS}
          (scope, version, config_json, secrets_ciphertext, secrets_nonce, change_summary, updated_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      scope,
      version,
      configJson,
      ciphertext,
      nonce,
      opts.changeSummary ?? "",
      now,
      opts.updatedBy,
    ],
  });

  return {
    scope,
    version,
    updatedAt: now,
    updatedBy: opts.updatedBy,
    config: mergedConfig,
    secretsMasked: maskSecrets(mergedSecrets),
  };
}

export async function rollbackRuntimeConfig(
  targetVersion: number,
  updatedBy: string,
  scope = RUNTIME_SCOPE_FOLLOW_UP
): Promise<RuntimeConfigPublic> {
  await ensureSchema();
  const key = encryptionKey();
  if (!key) throw new Error("AOL_CONFIG_ENCRYPTION_KEY is not configured");

  const res = await db.execute({
    sql: `SELECT config_json, secrets_ciphertext, secrets_nonce FROM ${TABLE_RUNTIME_CONFIG_REVISIONS}
          WHERE scope = ? AND version = ?`,
    args: [scope, targetVersion],
  });
  if (!res.rows.length) {
    throw new Error(`Revision v${targetVersion} not found`);
  }
  const row = res.rows[0] as Record<string, unknown>;
  const configJson = String(row.config_json ?? row[0]);
  const config = JSON.parse(configJson) as RuntimeConfigJson;
  const ciphertext = String(row.secrets_ciphertext ?? row[1]);
  const nonce = String(row.secrets_nonce ?? row[2]);
  const secrets = decryptSecrets(ciphertext, nonce, key);
  const newVersion =
    ((await getRuntimeConfig(scope))?.version ?? targetVersion) + 1;
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO ${TABLE_RUNTIME_CONFIG}
          (scope, config_json, secrets_ciphertext, secrets_nonce, version, updated_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(scope) DO UPDATE SET
            config_json=excluded.config_json,
            secrets_ciphertext=excluded.secrets_ciphertext,
            secrets_nonce=excluded.secrets_nonce,
            version=excluded.version,
            updated_at=excluded.updated_at,
            updated_by=excluded.updated_by`,
    args: [scope, configJson, ciphertext, nonce, newVersion, now, updatedBy],
  });
  await db.execute({
    sql: `INSERT INTO ${TABLE_RUNTIME_CONFIG_REVISIONS}
          (scope, version, config_json, secrets_ciphertext, secrets_nonce, change_summary, updated_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      scope,
      newVersion,
      configJson,
      ciphertext,
      nonce,
      `Rollback to v${targetVersion}`,
      now,
      updatedBy,
    ],
  });

  return {
    scope,
    version: newVersion,
    updatedAt: now,
    updatedBy,
    config,
    secretsMasked: maskSecrets(secrets),
  };
}

function validateConfig(c: RuntimeConfigJson): void {
  if (!["heuristic", "hunyuan", "deepseek"].includes(c.llm_provider)) {
    throw new Error("Invalid llm_provider");
  }
  if (!c.fsm_event_statuses?.trim()) {
    throw new Error("fsm_event_statuses is required");
  }
}

export type RuntimeConfigRevisionSummary = {
  version: number;
  changeSummary: string;
  updatedAt: string;
  updatedBy: string | null;
};

export async function listRuntimeConfigRevisions(
  scope = RUNTIME_SCOPE_FOLLOW_UP,
  limit = 10
): Promise<RuntimeConfigRevisionSummary[]> {
  await ensureSchema();
  const capped = Math.min(Math.max(1, limit), 50);
  const res = await db.execute({
    sql: `SELECT version, change_summary, updated_at, updated_by
          FROM ${TABLE_RUNTIME_CONFIG_REVISIONS}
          WHERE scope = ?
          ORDER BY version DESC
          LIMIT ?`,
    args: [scope, capped],
  });
  return res.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      version: Number(rowVal(r, "version", 0)),
      changeSummary: String(rowVal(r, "change_summary", 1) ?? ""),
      updatedAt: String(rowVal(r, "updated_at", 2)),
      updatedBy: rowVal<string | null>(r, "updated_by", 3) ?? null,
    };
  });
}

export function mergeSecretsForTest(
  stored: RuntimeSecrets | null,
  patch?: Partial<RuntimeSecrets>
): RuntimeSecrets {
  return { ...(stored ?? emptySecrets()), ...patch };
}
