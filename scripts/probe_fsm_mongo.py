#!/usr/bin/env python3
"""探测 FSM Mongo 连接与 206 候选池规模（读 .env，不打印密码）。

用法（仓库根，先按 .env.example 配好 FSM_MONGO_*）：
  python scripts/probe_fsm_mongo.py
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_PKG = ROOT / "packages" / "aol"
if str(_PKG) not in sys.path:
    sys.path.insert(0, str(_PKG))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")


def _mask_url(url: str) -> str:
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", url)


def main() -> int:
    from pymongo import MongoClient

    from aol.config import Config
    from aol.domain import follow_up_events_query, SA_COLLECTION, SA_PROJECTION
    from aol.integration.fsm_mongo import resolve_event_statuses, resolve_pilot_housekeepers

    cfg = Config()
    if cfg.fsm_source != "mongo":
        print(f"FSM_SOURCE={cfg.fsm_source}（需 mongo）")
        return 1
    if not cfg.fsm_mongo_url:
        print("缺少 FSM_MONGO_URL")
        return 1

    print(f"FSM_MONGO_DB={cfg.fsm_mongo_db}")
    print(f"FSM_MONGO_URL={_mask_url(cfg.fsm_mongo_url)}")
    print(f"事件={','.join(resolve_event_statuses(cfg))} max_age_days={cfg.fsm_max_age_days}")

    client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS= 8000)
    try:
        db = client[cfg.fsm_mongo_db]
        db.command("ping")
        print("ping: ok")

        resolve_pilot_housekeepers(cfg, db)
        pilots = cfg.resolved_pilot_ids
        if pilots is None:
            print("试点管家: 未配置（全量 supervisor 过滤关闭）")
        elif not pilots:
            print("试点管家: 配置无效，引擎将捞 0 条")
        else:
            names = [cfg.pilot_id_to_name.get(i, i) for i in pilots]
            print(f"试点管家: {len(pilots)} 人 — {', '.join(names)}")

        statuses = resolve_event_statuses(cfg)
        q = follow_up_events_query(
            event_statuses=statuses,
            stale_days=cfg.fsm_stale_days if cfg.fsm_stale_days > 0 else 0,
            max_age_days=cfg.fsm_max_age_days if cfg.fsm_max_age_days > 0 else 0,
            lookback_hours=cfg.lookback_hours if cfg.lookback_hours > 0 else 0,
            processed_ids=[],
            supervisor_ids=pilots,
            time_field=cfg.fsm_time_field,
        )
        n = db[SA_COLLECTION].count_documents(q)
        print(f"206 候选（未扣水位线）: {n} 条")

        sample = list(
            db[SA_COLLECTION]
            .find(q, {**SA_PROJECTION, "orderNum": 1})
            .sort(cfg.fsm_time_field, -1)
            .limit(3)
        )
        if sample:
            print("样例工单号:", ", ".join(str(d.get("orderNum") or d.get("_id")) for d in sample))
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
