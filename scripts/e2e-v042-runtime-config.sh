#!/usr/bin/env bash
# v0.4.2 E2E: migrate env → runtime_config + audit
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_PATH="${AOL_DEV_DB_PATH:-$ROOT/data/agent_loop_tracking.db}"
if [[ "$DB_PATH" != /* ]]; then
  DB_PATH="$ROOT/$DB_PATH"
fi

if [[ -z "${AOL_CONFIG_ENCRYPTION_KEY:-}" ]]; then
  export AOL_CONFIG_ENCRYPTION_KEY="$(openssl rand -base64 32)"
  echo "[e2e-v042] generated AOL_CONFIG_ENCRYPTION_KEY for local run"
fi

echo "[e2e-v042] migrate env → runtime_config..."
cd "$ROOT/apps/console"
LIBSQL_URL="file:$DB_PATH" node scripts/migrate-env-to-runtime-config.mjs

echo "[e2e-v042] audit..."
LIBSQL_URL="file:$DB_PATH" AOL_CONFIG_ENCRYPTION_KEY="$AOL_CONFIG_ENCRYPTION_KEY" \
  node scripts/v042-runtime-config-audit.mjs

echo "[e2e-v042] OK"
