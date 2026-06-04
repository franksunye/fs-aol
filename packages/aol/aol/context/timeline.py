"""工单时间轴物化（业务 + Agent）→ 写入 Turso timeline_events。"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from ..blocker_types import BLOCKER_LABELS
from ..context.enrich import (
    EnrichedContext,
    enrich_work_order_context,
    _CodeCache,
    _fmt_time,
    _PAY_STATE,
    _QUOTE_B_MARKS,
    _parse_order_doc,
)
from ..domain import FollowUpSuggestion, WorkOrder, bj_now

_BJ_TZ = timezone(timedelta(hours=8))
_UTC = timezone.utc

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


def _parse_bj_wall_ms(value: Any) -> Optional[int]:
    """exts.*Str 或引擎 bj_now ISO：墙上时间为北京时间。"""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        try:
            d = datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=_BJ_TZ)
            return int(d.timestamp() * 1000)
        except ValueError:
            return None
    try:
        if "T" not in s and len(s) >= 19:
            s = s[:19].replace(" ", "T")
        if s.endswith("Z"):
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        else:
            d = datetime.fromisoformat(s).replace(tzinfo=_BJ_TZ)
        return int(d.timestamp() * 1000)
    except ValueError:
        return None


def _parse_utc_naive_ms(value: Any) -> Optional[int]:
    """Mongo DateTime / 工单 updateTime 等：naive 实为 UTC（与 *Str 差 8h）。"""
    if value is None:
        return None
    if isinstance(value, datetime):
        d = value.replace(tzinfo=_UTC) if not value.tzinfo else value.astimezone(_UTC)
        return int(d.timestamp() * 1000)
    s = str(value).strip()
    if not s:
        return None
    try:
        if "T" not in s and len(s) >= 19:
            s = s[:19].replace(" ", "T")
        if s.endswith("Z"):
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        else:
            d = datetime.fromisoformat(s).replace(tzinfo=_UTC)
        return int(d.timestamp() * 1000)
    except ValueError:
        return None


def _parse_at_ms(value: Any) -> Optional[int]:
    """Agent 轨时间戳（trace / outcome / blocker）。"""
    return _parse_bj_wall_ms(value)


def _call_summary(doc: Dict[str, Any]) -> str:
    parts: List[str] = []
    col = str(doc.get("colName") or "").strip()
    if col:
        parts.append(col)
    dur = doc.get("bizDuration")
    if dur not in (None, ""):
        parts.append(f"{dur}秒")
    result = str(doc.get("result") or "").strip()
    if result and not result.startswith(("[", "{")):
        parts.append(result[:48])
    return " · ".join(parts) if parts else "通话记录"


def _milestone_events_from_sa(
    sa: Dict[str, Any],
    *,
    work_order_id: str,
    dedupe_key: str,
    order_num: str,
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    exts = sa.get("exts") or {}

    created_ms = _parse_bj_wall_ms(exts.get("ServiceAppointmentCreateTimeStr"))
    if created_ms is None:
        created_ms = _parse_utc_naive_ms(
            sa.get("createTime") or exts.get("ServiceAppointmentCreateTime")
        )
    if created_ms is not None:
        on = order_num or str(sa.get("orderNum") or "")
        events.append(
            _event(
                work_order_id=work_order_id,
                dedupe_key=dedupe_key,
                lane="business",
                kind="created",
                at_ms=created_ms,
                title="建单",
                summary=f"工单 {on}" if on else "工单创建",
            )
        )

    when = str(exts.get("prospectingTimeStr") or "").strip()
    appt_ms = _parse_bj_wall_ms(when) if when else None
    if appt_ms is None:
        appt_ms = _parse_utc_naive_ms(exts.get("prospectingTime"))
    if appt_ms is not None:
        if not when:
            when = _fmt_time(exts.get("prospectingTime"))
        events.append(
            _event(
                work_order_id=work_order_id,
                dedupe_key=dedupe_key,
                lane="business",
                kind="appointment",
                at_ms=appt_ms,
                title="预约",
                summary=f"预约勘察上门 · {when}" if when else "预约勘察上门",
            )
        )

    return events


def _phone_call_events(
    db: Any,
    sa_id: str,
    *,
    work_order_id: str,
    dedupe_key: str,
) -> List[Dict[str, Any]]:
    calls = list(
        db["speechText"]
        .find(
            {"serviceAppointmentId": sa_id, "state": {"$ne": -1}},
            {
                "callCreateTime": 1,
                "createTime": 1,
                "colName": 1,
                "bizDuration": 1,
                "result": 1,
            },
        )
        .sort("callCreateTime", 1)
        .limit(20)
    )
    if not calls:
        return []

    first = calls[0]
    at_ms = _parse_utc_naive_ms(
        first.get("callCreateTime") or first.get("createTime")
    )
    if at_ms is None:
        return []

    n = len(calls)
    if n == 1:
        summary = _call_summary(first)
    else:
        last = calls[-1]
        last_when = _fmt_time(last.get("callCreateTime") or last.get("createTime"))
        summary = f"共 {n} 次 · 最近 {last_when} · {_call_summary(last)}"

    return [
        _event(
            work_order_id=work_order_id,
            dedupe_key=dedupe_key,
            lane="business",
            kind="phone",
            at_ms=at_ms,
            title="电话联系",
            summary=summary,
        )
    ]


def _quote_events_from_db(
    db: Any,
    sa_id: str,
    codes: _CodeCache,
    *,
    work_order_id: str,
    dedupe_key: str,
) -> List[Dict[str, Any]]:
    sa_match = {
        "$or": [
            {"serviceAppointmentId": sa_id},
            {"serviceAppointmentIds": sa_id},
        ],
    }
    b_filter = {"state": {"$ne": -1}, "type": 1, "$and": [sa_match, _QUOTE_B_MARKS]}
    events: List[Dict[str, Any]] = []
    for doc in (
        db["order"]
        .find(
            b_filter,
            {
                "orderNumber": 1,
                "totalPrice": 1,
                "payState": 1,
                "createTime": 1,
                "bjProducts": 1,
            },
        )
        .sort("createTime", -1)
        .limit(5)
    ):
        at_ms = _parse_utc_naive_ms(doc.get("createTime"))
        if at_ms is None:
            continue
        parsed = _parse_order_doc(doc, codes)
        amt = parsed.get("amount_yuan")
        amt_s = f"{amt:.0f}元" if isinstance(amt, (int, float)) else "—"
        pay = parsed.get("pay_state_label") or _PAY_STATE.get(
            int(doc.get("payState") or 0), "未知"
        )
        pkgs = "、".join((parsed.get("package_names") or [])[:2])
        summary = f"{amt_s} · {pay}"
        if pkgs:
            summary += f" · {pkgs}"
        events.append(
            _event(
                work_order_id=work_order_id,
                dedupe_key=dedupe_key,
                lane="business",
                kind="quote",
                at_ms=at_ms,
                title="报价",
                summary=summary,
                ref_id=str(doc.get("orderNumber") or doc.get("_id") or ""),
            )
        )
    return events


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

    state_ms = _parse_utc_naive_ms(wo.completed_at)
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

            sa = db["serviceAppointment"].find_one(
                {"_id": sa_id},
                {
                    "orderNum": 1,
                    "createTime": 1,
                    "exts.ServiceAppointmentCreateTime": 1,
                    "exts.prospectingTime": 1,
                    "exts.prospectingTimeStr": 1,
                },
            )
            if sa:
                events.extend(
                    _milestone_events_from_sa(
                        sa,
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                        order_num=wo.order_num,
                    )
                )
                events.extend(
                    _phone_call_events(
                        db,
                        sa_id,
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                    )
                )

            for wn in (
                db["workflowNode"]
                .find(
                    {"serviceAppointmentId": sa_id},
                    {"nodeName": 1, "name": 1, "remark": 1, "createTime": 1},
                )
                .sort("createTime", -1)
                .limit(15)
            ):
                at_ms = _parse_utc_naive_ms(wn.get("createTime"))
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
                at_ms = _parse_utc_naive_ms(doc.get("createTime")) or _parse_utc_naive_ms(
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
                        title="勘察",
                        summary=f"{payload['surveyNum']} · {payload['partLabel']}",
                        ref_id=sid,
                        payload=payload,
                    )
                )

            events.extend(
                _quote_events_from_db(
                    db,
                    sa_id,
                    codes,
                    work_order_id=wid,
                    dedupe_key=dedupe_key,
                )
            )
            client.close()
        except Exception:
            pass

    for c in ctx.contracts[:5]:
        at_ms = _parse_utc_naive_ms(c.get("signed_at"))
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
