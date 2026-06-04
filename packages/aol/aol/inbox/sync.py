"""收件箱资格同步：只读 Mongo + enrich，不跑 LLM。"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from ..config import Config
from ..context.enrich import enrich_work_order_context
from ..domain import FollowUpSuggestion, work_order_from_sa
from ..integration.fsm_mongo import resolve_event_statuses
if TYPE_CHECKING:
    from ..tracking.store import OutcomeRecord, TrackingStore

logger = logging.getLogger("aol.inbox")

BUCKET_ACTIVE = "active"
BUCKET_CLOSED = "closed"
BUCKET_ARCHIVED = "archived"

REASON_HAS_OUTCOME = "has_outcome"
REASON_AGENT_NO_FOLLOW = "agent_no_follow"
REASON_LEFT_WEDGE = "left_wedge"
REASON_SIGNED_CONTRACT = "signed_contract"
REASON_PAID_AND_SIGNED = "paid_and_signed"
REASON_MONGO_MISSING = "mongo_missing"


@dataclass
class InboxState:
    bucket: str
    reason: str = ""
    mongo_status: str = ""
    live_verdict: str = ""


def initial_inbox_state(suggestion: FollowUpSuggestion) -> InboxState:
    if not suggestion.needs_follow_up:
        return InboxState(BUCKET_ARCHIVED, REASON_AGENT_NO_FOLLOW)
    return InboxState(BUCKET_ACTIVE)


def _parse_suggestion(raw: Any) -> FollowUpSuggestion:
    if isinstance(raw, str):
        return FollowUpSuggestion.from_dict(json.loads(raw))
    if isinstance(raw, dict):
        return FollowUpSuggestion.from_dict(raw)
    return FollowUpSuggestion()


def reconcile_inbox_row(
    cfg: Config,
    log: Dict[str, Any],
    outcome: Optional["OutcomeRecord"],
    sa_doc: Optional[Dict[str, Any]],
    *,
    wedge_statuses: Optional[List[str]] = None,
) -> InboxState:
    """根据 outcome、快照建议、当前 Mongo 判定 inbox_bucket。"""
    if outcome and outcome.decision:
        return InboxState(BUCKET_CLOSED, REASON_HAS_OUTCOME)

    suggestion = _parse_suggestion(log.get("suggestion"))
    if not suggestion.needs_follow_up:
        return InboxState(BUCKET_ARCHIVED, REASON_AGENT_NO_FOLLOW)

    if sa_doc is None:
        return InboxState(BUCKET_ARCHIVED, REASON_MONGO_MISSING)

    wo = work_order_from_sa(sa_doc)
    wo.event_type = str(log.get("event_type") or wo.event_type or "")
    ctx = enrich_work_order_context(cfg, wo)
    verdict = (ctx.business_verdict or "").replace("【结论】", "").strip()
    live = verdict[:240] if verdict else ""
    mongo_status = str(sa_doc.get("status") or "")

    # Agent 快照仍标「需要跟进」→ 留在待处置，由人在 Console 处置；
    # Mongo 已签约/离 wedge 等写在 live_verdict，避免整表被 sync 扫进归档后列表为空。
    statuses = wedge_statuses if wedge_statuses is not None else resolve_event_statuses(cfg)
    if statuses and mongo_status and mongo_status not in statuses:
        return InboxState(
            BUCKET_ACTIVE,
            REASON_LEFT_WEDGE,
            mongo_status=mongo_status,
            live_verdict=live,
        )

    if ctx.has_signed_contract:
        return InboxState(
            BUCKET_ACTIVE,
            REASON_SIGNED_CONTRACT,
            mongo_status=mongo_status,
            live_verdict=live,
        )

    return InboxState(BUCKET_ACTIVE, mongo_status=mongo_status, live_verdict=live)


def _fetch_sa_docs(cfg: Config, work_order_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not work_order_ids or cfg.fsm_source != "mongo" or not cfg.fsm_mongo_url:
        return {}
    from pymongo import MongoClient

    from ..domain import SA_PROJECTION

    out: Dict[str, Dict[str, Any]] = {}
    client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=12000)
    try:
        db = client[cfg.fsm_mongo_db]
        for doc in db["serviceAppointment"].find(
            {"_id": {"$in": work_order_ids}},
            SA_PROJECTION,
        ):
            out[str(doc["_id"])] = doc
    finally:
        client.close()
    return out


def run_inbox_sync(
    cfg: Config,
    store: "TrackingStore",
    *,
    dry_run: bool = False,
    limit: Optional[int] = None,
    order_num: Optional[str] = None,
    only_active: bool = True,
) -> Dict[str, int]:
    """刷新 follow_up_logs.inbox_bucket。默认只扫 active/NULL。"""
    logs = store.list_logs_for_inbox_sync(
        only_active=only_active and not (order_num or ""),
        limit=limit,
        order_num=order_num,
    )
    stats = {
        "total": len(logs),
        "active": 0,
        "closed": 0,
        "archived": 0,
        "unchanged": 0,
        "updated": 0,
    }
    if not logs:
        return stats

    keys = [str(r.get("dedupe_key") or "") for r in logs if r.get("dedupe_key")]
    outcomes = store.get_outcomes_for_dedupe_keys(keys)
    wids = list({str(r.get("work_order_id") or "") for r in logs if r.get("work_order_id")})
    sa_docs = _fetch_sa_docs(cfg, wids)

    for log in logs:
        dk = str(log.get("dedupe_key") or "")
        outcome = outcomes.get(dk)
        wid = str(log.get("work_order_id") or "")
        state = reconcile_inbox_row(cfg, log, outcome, sa_docs.get(wid))
        stats[state.bucket] = stats.get(state.bucket, 0) + 1

        prev_bucket = str(log.get("inbox_bucket") or BUCKET_ACTIVE)
        prev_reason = str(log.get("archive_reason") or "")
        if (
            prev_bucket == state.bucket
            and prev_reason == state.reason
            and str(log.get("mongo_status") or "") == state.mongo_status
        ):
            stats["unchanged"] += 1
            continue

        if not dry_run:
            store.update_inbox_state(
                dk,
                bucket=state.bucket,
                archive_reason=state.reason,
                mongo_status=state.mongo_status,
                live_verdict=state.live_verdict,
            )
        stats["updated"] += 1
        ref = log.get("order_num") or wid
        logger.info(
            "inbox %s → %s (%s) %s",
            ref,
            state.bucket,
            state.reason or "—",
            "[dry-run]" if dry_run else "",
        )

    return stats
