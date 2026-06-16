"""事实漂移触发再分析：业务 Mongo 事实相对上次 Run 的 fact_snapshot 已变化。"""

from __future__ import annotations

from typing import Any, Dict, Optional, Set, TYPE_CHECKING

from ..config import Config
from ..context.enrich import enrich_work_order_context
from ..context.fact_snapshot import (
    build_fact_snapshot,
    fact_fingerprint,
    parse_fact_snapshot_from_trace_steps,
)
from ..domain import work_order_from_sa
from ..reprocess.time_trigger import REANALYZE_EVENT_TYPES

if TYPE_CHECKING:
    from ..tracking.store import TrackingStore


def _latest_trace_for_log(store: "TrackingStore", log: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    wid = str(log.get("work_order_id") or "")
    if not wid:
        return None
    traces = store.list_traces_for_work_order(wid)
    if not traces:
        return None
    t = traces[-1]
    return {
        "steps_json": getattr(t, "steps_json", "") or "",
        "created_at": getattr(t, "created_at", "") or "",
    }


def live_fact_fingerprint(cfg: Config, log: Dict[str, Any]) -> Optional[str]:
    """对单条 log 拉当前 Mongo 事实并算指纹（只读）。"""
    if cfg.fsm_source != "mongo" or not cfg.fsm_mongo_url:
        return None
    wid = str(log.get("work_order_id") or "")
    if not wid:
        return None
    try:
        from pymongo import MongoClient

        client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=8000)
        db = client[cfg.fsm_mongo_db]
        sa = db["serviceAppointment"].find_one({"_id": wid})
        client.close()
        if not sa:
            return None
        wo = work_order_from_sa(sa)
        wo.event_type = str(log.get("event_type") or wo.event_type or "")
        ctx = enrich_work_order_context(cfg, wo)
        snap = build_fact_snapshot(ctx, captured_at="")
        return fact_fingerprint(snap)
    except Exception:
        return None


def should_fact_reprocess_log(
    cfg: Config,
    log: Dict[str, Any],
    store: "TrackingStore",
) -> bool:
    event_type = str(log.get("event_type") or "")
    if event_type not in REANALYZE_EVENT_TYPES:
        return False
    bucket = str(log.get("inbox_bucket") or "active").strip() or "active"
    if bucket != "active":
        return False

    trace = _latest_trace_for_log(store, log)
    if not trace:
        return False
    prev = parse_fact_snapshot_from_trace_steps(trace.get("steps_json") or "")
    if not prev:
        return False
    prev_fp = str(prev.get("fingerprint") or "")
    if not prev_fp:
        return False
    live_fp = live_fact_fingerprint(cfg, log)
    if not live_fp:
        return False
    return live_fp != prev_fp


def select_fact_drift_reprocess_keys(cfg: Config, store: "TrackingStore") -> Set[str]:
    logs = store.list_logs_for_inbox_sync(only_active=True)
    if not logs:
        return set()

    ranked: list[tuple[str, int]] = []
    for log in logs:
        dk = str(log.get("dedupe_key") or "")
        if not dk:
            continue
        if not should_fact_reprocess_log(cfg, log, store):
            continue
        # 金额变更优先于纯时间触发
        ranked.append((dk, 1))

    cap = cfg.reanalyze_max_per_run
    if cap > 0:
        ranked = ranked[:cap]
    return {dk for dk, _ in ranked}
