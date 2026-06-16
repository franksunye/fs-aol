"""识别需要重新推理的 follow_up_logs（事实漂移 / 建议与 Mongo 不一致）。"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING

from ..config import Config
from ..context.enrich import enrich_work_order_context
from ..domain import FollowUpSuggestion, work_order_from_sa
from ..reprocess.fact_drift import should_fact_reprocess_log

if TYPE_CHECKING:
    from ..tracking.store import TrackingStore

_MONEY_RE = re.compile(r"([\d,]+)\s*元")


def _parse_suggestion(raw: Any) -> FollowUpSuggestion:
    if isinstance(raw, str):
        try:
            return FollowUpSuggestion.from_dict(json.loads(raw))
        except json.JSONDecodeError:
            return FollowUpSuggestion()
    if isinstance(raw, dict):
        return FollowUpSuggestion.from_dict(raw)
    return FollowUpSuggestion()


def _amounts_in_text(text: str) -> List[int]:
    out: List[int] = []
    for m in _MONEY_RE.finditer(text or ""):
        try:
            n = int(float(m.group(1).replace(",", "")))
            if n > 0:
                out.append(n)
        except ValueError:
            continue
    return out


def _quote_amount_from_suggestion(s: FollowUpSuggestion) -> Optional[int]:
    hay = " ".join(
        [
            s.reason_summary or "",
            s.situation.amount_plan or "",
            *(s.evidence_refs or []),
        ]
    )
    amounts = _amounts_in_text(hay)
    return amounts[0] if amounts else None


def _live_enrich(cfg: Config, log: Dict[str, Any]) -> Tuple[Any, Any]:
    from pymongo import MongoClient

    wid = str(log.get("work_order_id") or "")
    client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=8000)
    db = client[cfg.fsm_mongo_db]
    sa = db["serviceAppointment"].find_one({"_id": wid})
    client.close()
    if not sa:
        return None, None
    wo = work_order_from_sa(sa)
    wo.event_type = str(log.get("event_type") or wo.event_type or "")
    ctx = enrich_work_order_context(cfg, wo)
    return wo, ctx


def reprocess_reason(
    cfg: Config,
    log: Dict[str, Any],
    store: "TrackingStore",
) -> Optional[str]:
    """若需重跑返回原因码，否则 None。"""
    if should_fact_reprocess_log(cfg, log, store):
        return "fact_drift"

    suggestion = _parse_suggestion(log.get("suggestion"))
    wo, ctx = _live_enrich(cfg, log)
    if ctx is None:
        return None

    if ctx.has_signed_contract:
        if suggestion.needs_follow_up:
            return "signed_but_needs_follow"
        if suggestion.situation.quote_status not in ("已有生效签约", ""):
            return "quote_status_stale"

    if ctx.quotes:
        live_amt = ctx.quotes[0].get("amount_yuan")
        sug_amt = _quote_amount_from_suggestion(suggestion)
        if (
            isinstance(live_amt, (int, float))
            and live_amt > 0
            and sug_amt is not None
            and int(live_amt) != int(sug_amt)
        ):
            return "amount_mismatch"

    return None


def select_reprocess_candidates(
    cfg: Config,
    store: "TrackingStore",
    *,
    order_num: Optional[str] = None,
    work_order_id: Optional[str] = None,
    limit: Optional[int] = None,
) -> List[Tuple[Dict[str, Any], str]]:
    from ..integration.subject_resolve import filter_follow_up_logs

    logs = store.list_follow_up_logs(limit=None)
    logs = filter_follow_up_logs(
        logs,
        work_order_id=str(work_order_id or ""),
        order_num=str(order_num or ""),
    )
    ranked: List[Tuple[Dict[str, Any], str]] = []
    for log in logs:
        reason = reprocess_reason(cfg, log, store)
        if reason:
            ranked.append((log, reason))
    if limit is not None and limit > 0:
        ranked = ranked[:limit]
    return ranked
