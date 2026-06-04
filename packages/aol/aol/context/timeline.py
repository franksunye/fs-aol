"""工单时间轴物化（业务 + Agent）→ 写入 Turso timeline_events。"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from ..blocker_types import BLOCKER_LABELS
from ..context.enrich import EnrichedContext, enrich_work_order_context, _CodeCache, _fmt_time
from ..domain import FollowUpSuggestion, WorkOrder, bj_now

if TYPE_CHECKING:
    from ..config import Config
    from ..tracking.store import TrackingStore
    from ..tracking.trace import ReasoningTrace

_DECISION_LABELS = {
    "approved": "已同意",
    "rejected": "已拒绝",
    "modified": "已修改",
    "followed_up": "已跟进",
}


def _parse_at_ms(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, datetime):
        ms = int(value.timestamp() * 1000)
        return ms
    s = str(value).strip()
    if not s:
        return None
    try:
        if "T" not in s and len(s) >= 19:
            s = s[:19].replace(" ", "T")
        d = datetime.fromisoformat(s.replace("Z", "+00:00") if s.endswith("Z") else s)
        return int(d.timestamp() * 1000)
    except ValueError:
        return None


def _event(
    *,
    work_order_id: str,
    dedupe_key: str,
    lane: str,
    kind: str,
    at_ms: int,
    title: str,
    summary: str = "",
    ref_id: str = "",
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "work_order_id": work_order_id,
        "dedupe_key": dedupe_key,
        "lane": lane,
        "kind": kind,
        "at": datetime.utcfromtimestamp(at_ms / 1000).isoformat() + "Z",
        "at_ms": at_ms,
        "title": title,
        "summary": summary,
        "ref_id": ref_id,
        "payload_json": json.dumps(payload, ensure_ascii=False) if payload else None,
    }


def _survey_payload(doc: Dict[str, Any], codes: _CodeCache) -> Dict[str, Any]:
    parts = doc.get("part") or []
    if not isinstance(parts, list):
        parts = [parts]
    part_names = [codes.label(p) for p in parts if codes.label(p)]
    causes = doc.get("leakageCause") or []
    if not isinstance(causes, list):
        causes = [causes] if causes else []

    def _num(v: Any) -> str:
        if v is None or v == "":
            return "—"
        return str(v)

    return {
        "surveyNum": str(doc.get("surveyNum") or "—"),
        "partLabel": "、".join(part_names) or "—",
        "surveyTime": str(doc.get("surveyTime") or "—"),
        "address": str(doc.get("address") or "—"),
        "supervisorName": str(doc.get("supervisorName") or "—"),
        "planeArea": _num(doc.get("planeArea")),
        "squareMeter": _num(doc.get("squareMeter")),
        "memo": str(doc.get("memo") or "").strip() or "—",
        "leakageCause": "、".join(str(c) for c in causes) or "—",
        "createTime": _fmt_time(doc.get("createTime")),
        "updateTime": _fmt_time(doc.get("updateTime")),
    }


def _business_events(
    cfg: "Config",
    wo: WorkOrder,
    dedupe_key: str,
    ctx: EnrichedContext,
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    wid = wo.work_order_id

    state_ms = _parse_at_ms(wo.completed_at)
    if state_ms:
        stale = f" · 停留 {wo.stale_days} 天" if wo.stale_days else ""
        events.append(
            _event(
                work_order_id=wid,
                dedupe_key=dedupe_key,
                lane="business",
                kind="state",
                at_ms=state_ms,
                title="工单状态",
                summary=f"进入当前状态{stale}",
            )
        )

    if cfg.fsm_source == "mongo" and cfg.fsm_mongo_url:
        try:
            from pymongo import MongoClient

            client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=8000)
            db = client[cfg.fsm_mongo_db]
            codes = _CodeCache(db)
            sa_id = wo.work_order_id

            for wn in (
                db["workflowNode"]
                .find(
                    {"serviceAppointmentId": sa_id},
                    {"nodeName": 1, "name": 1, "remark": 1, "createTime": 1},
                )
                .sort("createTime", -1)
                .limit(15)
            ):
                at_ms = _parse_at_ms(wn.get("createTime"))
                if at_ms is None:
                    continue
                name = str(wn.get("nodeName") or wn.get("name") or "流程节点")
                remark = str(wn.get("remark") or "").strip()
                events.append(
                    _event(
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                        lane="business",
                        kind="workflow",
                        at_ms=at_ms,
                        title=f"流程 · {name}",
                        summary=remark,
                    )
                )

            for doc in (
                db["survey"]
                .find(
                    {"sid": sa_id, "state": {"$ne": -1}},
                    {
                        "surveyNum": 1,
                        "part": 1,
                        "surveyTime": 1,
                        "address": 1,
                        "supervisorName": 1,
                        "planeArea": 1,
                        "squareMeter": 1,
                        "memo": 1,
                        "leakageCause": 1,
                        "createTime": 1,
                        "updateTime": 1,
                    },
                )
                .sort("createTime", -1)
                .limit(8)
            ):
                at_ms = _parse_at_ms(doc.get("createTime")) or _parse_at_ms(
                    doc.get("updateTime")
                )
                if at_ms is None:
                    continue
                sid = str(doc.get("_id"))
                payload = _survey_payload(doc, codes)
                events.append(
                    _event(
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                        lane="business",
                        kind="survey",
                        at_ms=at_ms,
                        title="勘察单",
                        summary=f"{payload['surveyNum']} · 勘察部位 {payload['partLabel']}",
                        ref_id=sid,
                        payload=payload,
                    )
                )
            client.close()
        except Exception:
            pass

    for q in ctx.quotes[:5]:
        at_ms = _parse_at_ms(q.get("quote_date"))
        if at_ms is None:
            continue
        amt = q.get("amount_yuan")
        amt_s = f"{amt:.0f}元" if isinstance(amt, (int, float)) else "—"
        events.append(
            _event(
                work_order_id=wid,
                dedupe_key=dedupe_key,
                lane="business",
                kind="quote",
                at_ms=at_ms,
                title="正式报价",
                summary=f"{amt_s} · {q.get('pay_state_label', '—')}",
            )
        )

    for c in ctx.contracts[:5]:
        at_ms = _parse_at_ms(c.get("signed_at"))
        if at_ms is None:
            continue
        amt = c.get("amount_yuan")
        amt_s = f"{amt:.0f}元" if isinstance(amt, (int, float)) else "—"
        events.append(
            _event(
                work_order_id=wid,
                dedupe_key=dedupe_key,
                lane="business",
                kind="contract",
                at_ms=at_ms,
                title="生效签约",
                summary=f"{c.get('contract_num', '—')} · {amt_s}",
            )
        )

    return events


def _agent_events(
    wo: WorkOrder,
    dedupe_key: str,
    suggestion: FollowUpSuggestion,
    trace: "ReasoningTrace",
    store: "TrackingStore",
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    wid = wo.work_order_id
    trace_ms = _parse_at_ms(trace.created_at) or _parse_at_ms(bj_now().isoformat())
    if trace_ms is None:
        trace_ms = 0

    if trace.steps_json:
        try:
            steps = json.loads(trace.steps_json)
        except json.JSONDecodeError:
            steps = []
        for st in steps:
            if st.get("name") == "enrich_work_order_context":
                out = st.get("output") or {}
                verdict = str(out.get("business_verdict") or "").replace("【结论】", "").strip()
                events.append(
                    _event(
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                        lane="agent",
                        kind="enrich",
                        at_ms=trace_ms,
                        title="系统查证",
                        summary=verdict[:200] if verdict else "已完成业务查证",
                    )
                )
                break

    primary = (suggestion.action_plan.primary_action or suggestion.reason_summary or "")[
        :120
    ]
    events.append(
        _event(
            work_order_id=wid,
            dedupe_key=dedupe_key,
            lane="agent",
            kind="suggestion",
            at_ms=trace_ms,
            title="生成跟进建议",
            summary=primary or f"优先级 {suggestion.priority}",
        )
    )

    outcome = store.get_latest_outcome(dedupe_key)
    if outcome and outcome.decision:
        oms = _parse_at_ms(outcome.created_at)
        if oms:
            label = _DECISION_LABELS.get(outcome.decision, outcome.decision)
            summary = label + (f"（{outcome.note}）" if outcome.note else "")
            events.append(
                _event(
                    work_order_id=wid,
                    dedupe_key=dedupe_key,
                    lane="agent",
                    kind="outcome",
                    at_ms=oms,
                    title="管家反馈",
                    summary=summary,
                )
            )

    blocker = store.get_latest_blocker(dedupe_key)
    if blocker and blocker.blocker_type != "UNKNOWN":
        bms = _parse_at_ms(blocker.created_at)
        if bms:
            label = BLOCKER_LABELS.get(blocker.blocker_type, blocker.blocker_type)
            summary = label + (f" — {blocker.note}" if blocker.note else "")
            events.append(
                _event(
                    work_order_id=wid,
                    dedupe_key=dedupe_key,
                    lane="agent",
                    kind="blocker",
                    at_ms=bms,
                    title="卡点反馈",
                    summary=summary,
                )
            )

    return events


def build_timeline_events(
    cfg: "Config",
    wo: WorkOrder,
    suggestion: FollowUpSuggestion,
    trace: "ReasoningTrace",
    store: "TrackingStore",
) -> List[Dict[str, Any]]:
    ctx = enrich_work_order_context(cfg, wo)
    events = _business_events(cfg, wo, wo.dedupe_key, ctx)
    events.extend(_agent_events(wo, wo.dedupe_key, suggestion, trace, store))
    events.sort(key=lambda e: e["at_ms"], reverse=True)
    return events
