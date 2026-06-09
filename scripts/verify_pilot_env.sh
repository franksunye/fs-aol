#!/usr/bin/env bash
# 真发切换前检查清单（读 GHA vars / 本地 env，不修改任何配置）
set -euo pipefail

ok=0
warn=0
fail=0

check() {
  local label="$1"
  local cond="$2"
  if eval "$cond"; then
    echo "✓ $label"
    ok=$((ok + 1))
  else
    echo "✗ $label"
    fail=$((fail + 1))
  fi
}

warn_if() {
  local label="$1"
  local cond="$2"
  if eval "$cond"; then
    echo "⚠ $label"
    warn=$((warn + 1))
  fi
}

echo "=== FS-AOL 试点环境检查 ==="

check "FSM_EVENT_STATUSES=206（或空则默认 206）" \
  '[[ "${FSM_EVENT_STATUSES:-206}" == "206" ]]'

check "FSM_MAX_AGE_DAYS≤14（或空则默认 14）" \
  '[[ "${FSM_MAX_AGE_DAYS:-14}" -le 14 ]]'

check "AGENT_MODE=steps（或空则默认 steps）" \
  '[[ "${AGENT_MODE:-steps}" == "steps" ]]'

check "TRACKING_SOURCE 已设（cloud 或 local）" \
  '[[ -n "${TRACKING_SOURCE:-cloud}" ]]'

check "TURSO_URL 或 TRACKING_SOURCE=local" \
  '[[ "${TRACKING_SOURCE:-cloud}" == "local" || -n "${TURSO_URL:-}" ]]'

check "CONSOLE_BASE_URL 已设" \
  '[[ -n "${CONSOLE_BASE_URL:-}" ]]'

warn_if "DRY_RUN=true（预览模式，非真发）" \
  '[[ "${DRY_RUN:-true}" == "true" ]]'

warn_if "FSM_MONGO_DB 非 xlink（非生产库）" \
  '[[ -n "${FSM_MONGO_DB:-}" && "${FSM_MONGO_DB}" != "xlink" ]]'

warn_if "FSM_BATCH_LIMIT>10（大批量可能影响再分析补捞时效）" \
  '[[ "${FSM_BATCH_LIMIT:-50}" -gt 10 ]]'

echo ""
echo "结果: ${ok} 通过, ${warn} 警告, ${fail} 失败"

if [[ "$fail" -gt 0 ]]; then
  echo "请先修复失败项再切真发。"
  exit 1
fi

if [[ "${DRY_RUN:-true}" == "true" ]]; then
  echo "当前为 DRY_RUN 预览；切真发请在 GHA Variables 设 DRY_RUN=false。"
fi

exit 0
