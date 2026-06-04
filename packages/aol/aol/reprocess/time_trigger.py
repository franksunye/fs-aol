"""时间触发再分析：从水位线临时放行，允许同一 dedupe_key 再次推理。"""

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, TYPE_CHECKING

from ..config import Config
from ..domain import (
    EVENT_PAYMENT_PENDING,
    EVENT_STALE_SIGN_PENDING,
    EVENT_STALE_VISIT_NO_DEAL,
    FollowUpSuggestion,
    bj_now,
)
if TYPE_CHECKING:
    from ..tracking.store import OutcomeRecord, TrackingStore

REANALYZE_EVENT_TYPES = frozenset({
    EVENT_STALE_SIGN_PENDING,
    EVENT_STALE_VISIT_NO_DEAL,
    EVENT_PAYMENT_PENDING,
})

_PRIORITY_RANK = {"低": 1, "中": 2, "高": 3}
_STALE_RE = re.compile(r"(?:停留|已停留)\s*(\d+)\s*天")


def parse_state_at_bj(state_at: str) -> Optional[datetime]:
    raw = (state_at or "").strip()
    if not raw:
        return None
    s = raw.replace("Z", "")[:26].replace(" ", "T")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def compute_stale_days_from_state_at(
    state_at: Optional[str],
    *,
    now: Optional[datetime] = None,
) -> Optional[int]:
    at = parse_state_at_bj(state_at or "")
    if at is None:
        return None
    now = now or bj_now()
    delta = now - at
    if delta.total_seconds() < 0:
        return 0
    return max(0, delta.days)


def extract_stale_days_from_suggestion(raw: Any) -> Optional[int]:
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {}
    elif isinstance(raw, dict):
        data = raw
    else:
        return None
    haystack = " ".join(
        [
            str(data.get("原因摘要") or ""),
            * [str(x) for x in (data.get("优先级依据") or [])],
        ]
    )
    m = _STALE_RE.search(haystack)
    if not m:
        return None
    n = int(m.group(1))
    return n if n > 0 else None


def _parse_processed_at(value: Any) -> Optional[datetime]:
    raw = str(value or "").strip()
    if not raw:
        return None
    s = raw.replace("Z", "+00:00")[:32]
    try:
        dt = datetime.fromisoformat(s.replace(" ", "T"))
        if dt.tzinfo:
            return dt.astimezone().replace(tzinfo=None)
        return dt
    except ValueError:
        return None


def _parse_suggestion(raw: Any) -> FollowUpSuggestion:
    if isinstance(raw, str):
        try:
            return FollowUpSuggestion.from_dict(json.loads(raw))
        except json.JSONDecodeError:
            return FollowUpSuggestion()
    if isinstance(raw, dict):
        return FollowUpSuggestion.from_dict(raw)
    return FollowUpSuggestion()


def _priority_rank(priority: str) -> int:
    return _PRIORITY_RANK.get((priority or "").strip(), 0)


def resolve_current_stale_days(log: Dict[str, Any], *, now: Optional[datetime] = None) -> int:
    from_state = compute_stale_days_from_state_at(
        str(log.get("state_at") or "") or None,
        now=now,
    )
    if from_state is not None:
        return from_state
    analyzed = log.get("analyzed_stale_days")
    if analyzed is not None and str(analyzed).strip() != "":
        try:
            return max(0, int(analyzed))
        except (TypeError, ValueError):
            pass
    extracted = extract_stale_days_from_suggestion(log.get("suggestion"))
    return extracted if extracted is not None else 0


def resolve_analyzed_stale_days(log: Dict[str, Any]) -> int:
    analyzed = log.get("analyzed_stale_days")
    if analyzed is not None and str(analyzed).strip() != "":
        try:
            return max(0, int(analyzed))
        except (TypeError, ValueError):
            pass
    extracted = extract_stale_days_from_suggestion(log.get("suggestion"))
    return extracted if extracted is not None else 0


def should_time_reprocess_log(
    cfg: Config,
    log: Dict[str, Any],
    outcome: Optional["OutcomeRecord"],
    *,
    now: Optional[datetime] = None,
) -> bool:
    """单条 follow_up_log 是否应再次入池（仍须 Mongo 仍在 wedge）。"""
    if not cfg.reanalyze_enabled:
        return False
    if str(log.get("event_type") or "") not in REANALYZE_EVENT_TYPES:
        return False

    bucket = str(log.get("inbox_bucket") or "active").strip() or "active"
    if bucket in ("closed", "archived"):
        return False

    if outcome and outcome.decision in ("approved", "rejected", "modified"):
        return False

    suggestion = _parse_suggestion(log.get("suggestion"))
    if not suggestion.needs_follow_up:
        return False

    now = now or bj_now()
    processed_at = _parse_processed_at(log.get("processed_at"))
    days_since = 0
    if processed_at is not None:
        days_since = max(0, (now - processed_at).days)

    interval = cfg.reanalyze_interval_days
    step = cfg.reanalyze_stale_step_days
    if interval <= 0 and step <= 0:
        return False

    interval_hit = interval > 0 and days_since >= interval
    current_stale = resolve_current_stale_days(log, now=now)
    analyzed_stale = resolve_analyzed_stale_days(log)
    stale_step_hit = step > 0 and current_stale >= analyzed_stale + step

    return interval_hit or stale_step_hit


def select_time_reprocess_keys(cfg: Config, store: "TrackingStore") -> Set[str]:
    """本 run 允许重新推理的 dedupe_key（受 REANALYZE_MAX_PER_RUN 限制）。"""
    logs = store.list_logs_for_inbox_sync(only_active=True)
    if not logs:
        return set()

    keys = [str(r.get("dedupe_key") or "") for r in logs if r.get("dedupe_key")]
    outcomes = store.get_outcomes_for_dedupe_keys(keys)

    ranked: List[tuple[str, int, int]] = []
    now = bj_now()
    for log in logs:
        dk = str(log.get("dedupe_key") or "")
        if not dk:
            continue
        if not should_time_reprocess_log(cfg, log, outcomes.get(dk), now=now):
            continue
        current = resolve_current_stale_days(log, now=now)
        analyzed = resolve_analyzed_stale_days(log)
        ranked.append((dk, current, current - analyzed))

    ranked.sort(key=lambda x: (x[2], x[1]), reverse=True)
    cap = cfg.reanalyze_max_per_run
    if cap > 0:
        ranked = ranked[:cap]
    return {dk for dk, _, _ in ranked}


def reanalysis_should_push(
    cfg: Config,
    old_log: Optional[Dict[str, Any]],
    new_suggestion: FollowUpSuggestion,
) -> bool:
    """再分析后是否推企微（避免同优先级重复打扰）。"""
    if not cfg.reanalyze_push:
        return False
    if not new_suggestion.needs_follow_up:
        return False
    if not old_log:
        return True
    old = _parse_suggestion(old_log.get("suggestion"))
    if not old.needs_follow_up:
        return True
    if cfg.reanalyze_push_on_same_priority:
        return True
    return _priority_rank(new_suggestion.priority) > _priority_rank(old.priority)
