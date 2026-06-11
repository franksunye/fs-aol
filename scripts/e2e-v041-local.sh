#!/usr/bin/env bash
# v0.4.1 local E2E: seed + cron (engine snapshot) + audit
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_PATH="${AOL_DEV_DB_PATH:-$ROOT/data/agent_loop_tracking.db}"
if [[ "$DB_PATH" != /* ]]; then
  DB_PATH="$ROOT/$DB_PATH"
fi
export AOL_DEV_DB_PATH="$DB_PATH"

echo "[e2e-v041] DB: $DB_PATH"

echo "[e2e-v041] seed mock 206..."
bash scripts/dev-local.sh seed >/dev/null

echo "[e2e-v041] sync console .env.local LIBSQL_URL if needed..."
ENV_LOCAL="$ROOT/apps/console/.env.local"
if [[ -f "$ENV_LOCAL" ]]; then
  if ! grep -q "file:$DB_PATH" "$ENV_LOCAL" 2>/dev/null; then
    echo "  hint: set LIBSQL_URL=file:$DB_PATH in apps/console/.env.local"
  fi
else
  cp apps/console/.env.local.sqlite.example "$ENV_LOCAL"
  sed -i.bak "s|file:/tmp/fs-aol-dev.db|file:$DB_PATH|" "$ENV_LOCAL" 2>/dev/null || \
    sed -i '' "s|file:/tmp/fs-aol-dev.db|file:$DB_PATH|" "$ENV_LOCAL"
  rm -f "$ENV_LOCAL.bak"
fi

if [[ "$DB_PATH" != /tmp/fs-aol-dev.db ]]; then
  mkdir -p "$(dirname "$DB_PATH")"
  cp /tmp/fs-aol-dev.db "$DB_PATH" 2>/dev/null || true
fi

echo "[e2e-v041] run cron (writes engine_runtime_snapshot)..."
TRACKING_LOCAL_PATH="$DB_PATH" make cron >/dev/null

echo "[e2e-v041] audit..."
cd apps/console
LIBSQL_URL="file:$DB_PATH" node scripts/v041-live-surface-audit.mjs --limit=4

echo "[e2e-v041] OK"
