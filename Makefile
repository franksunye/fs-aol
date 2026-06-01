.PHONY: smoke dev cron install dev-local seed-local bench-console bench-console-turso

PY ?= python3
ifeq ($(wildcard .venv/bin/python),)
else
  PY := .venv/bin/python
endif

smoke:
	bash scripts/smoke.sh

dev:
	pnpm --filter console dev

# 本地 v0.2.x 闭环：mock 206 → sqlite → Console
seed-local:
	bash scripts/dev-local.sh seed

dev-local: seed-local
	pnpm --filter console dev

cron:
	$(PY) run_cron.py

install:
	$(PY) -m pip install -e packages/aol
	pnpm install

# Console 读路径基线（本地 sqlite）；对比 legacy vs optimized SQL
bench-console:
	cd apps/console && npx tsx scripts/bench-read-path.ts --iterations=8 --save=baseline

# 需 apps/console/.env.local 指向 Turso（或 export LIBSQL_*）
bench-console-turso:
	cd apps/console && npx tsx scripts/bench-read-path.ts --iterations=10 --save=optimized-turso

# 真实 lib/suggestions（推荐，与生产一致）
bench-console-lib:
	cd apps/console && npx tsx scripts/bench-lib-integration.ts --iterations=8 --save=optimized-turso-lib
