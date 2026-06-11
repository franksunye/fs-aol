#!/usr/bin/env bash
# v0.4.3 E2E: binding parity + Console integration API smoke
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${ROOT}/.venv/bin/python"
if [[ ! -x "$PY" ]]; then
  python3 -m venv "${ROOT}/.venv"
  "${ROOT}/.venv/bin/pip" install -q -e packages/aol pytest
  PY="${ROOT}/.venv/bin/python"
fi

echo "[e2e-v043] binding mapper parity..."
"$PY" -m pytest packages/aol/tests/test_binding_mapper.py -q

echo "[e2e-v043] binding JSON present..."
test -f contracts/integration-bindings/xlink-fsm.v1.json
test -f contracts/integration-bindings/schema.json

DB_PATH="${AOL_DEV_DB_PATH:-$ROOT/data/agent_loop_tracking.db}"
if [[ "$DB_PATH" != /* ]]; then
  DB_PATH="$ROOT/$DB_PATH"
fi

if [[ -z "${AOL_CONFIG_ENCRYPTION_KEY:-}" ]]; then
  export AOL_CONFIG_ENCRYPTION_KEY="$(openssl rand -base64 32)"
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "[e2e-v043] seed runtime_config via migrate..."
  cd "$ROOT/apps/console"
  LIBSQL_URL="file:$DB_PATH" node scripts/migrate-env-to-runtime-config.mjs
  cd "$ROOT"
fi

echo "[e2e-v043] console build (includes sync-contracts)..."
pnpm --filter console build

echo "[e2e-v043] OK"
