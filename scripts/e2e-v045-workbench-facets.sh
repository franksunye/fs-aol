#!/usr/bin/env bash
# v0.4.5 E2E: workbench display facets — merge/resolve + binding + build
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${ROOT}/.venv/bin/python"
if [[ ! -x "$PY" ]]; then
  python3 -m venv "${ROOT}/.venv"
  "${ROOT}/.venv/bin/pip" install -q -e packages/aol pytest
  PY="${ROOT}/.venv/bin/python"
fi

echo "[e2e-v045] binding mapper parity..."
"$PY" -m pytest packages/aol/tests/test_binding_mapper.py -q

echo "[e2e-v045] workbench-display unit..."
cd apps/console
npx --yes tsx lib/integration-bindings/workbench-display.test.ts
cd "$ROOT"

echo "[e2e-v045] doc + code anchors..."
test -f docs/public/PUB-25-v045-workbench-display-facets.md
test -f apps/console/lib/integration-bindings/workbench-display.ts
test -f apps/console/components/action-center/related-object-cell.tsx
grep -q workbench_display contracts/integration-bindings/xlink-fsm.v1.json
grep -q binding_overrides apps/console/lib/runtime-config/types.ts

echo "[e2e-v045] console build..."
pnpm --filter console build

echo "[e2e-v045] OK"
