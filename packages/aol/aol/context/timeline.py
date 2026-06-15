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
    _SOURCE_TYPE,
    _fmt_time,
    _PAY_STATE,
    _QUOTE_B_MARKS,
    _flatten_leak_codes,
    _parse_bj_quote_row,
    _parse_order_doc,
    _resolve_channel_path,
)
from ..domain import FollowUpSuggestion, WorkOrder, bj_now, fsm_status_label
from .quote_products import quote_line_to_payload

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

_INBOX_BUCKET_LABELS = {
    "active": "待处置",
    "closed": "已处置",
    "archived": "归档",
}

_ARCHIVE_REASON_LABELS = {
    "has_outcome": "已有处置反馈",
    "agent_no_follow": "Agent 判定无需跟进",
    "left_wedge": "已离开跟进楔子（非待签约等触发状态）",
    "signed_contract": "已有生效签约",
    "paid_and_signed": "已签约且已支付",
    "mongo_missing": "Mongo 无此工单",
}

_LOG_STATUS_LABELS = {
    "sent": "已推送",
    "reanalyzed": "再分析已推送",
    "reanalyzed_no_push": "再分析未推送企微",
    "reanalyzed_send_failed": "再分析推送失败",
    "reanalyzed_skipped_no_follow_up": "再分析·无需跟进",
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


def _format_duration_seconds(raw: Any) -> str:
    try:
        total = int(float(raw))
    except (TypeError, ValueError):
        return ""
    if total < 0:
        return ""
    if total < 60:
        return f"{total}秒"
    minutes, seconds = divmod(total, 60)
    if minutes < 60:
        return f"{minutes}分钟" if seconds == 0 else f"{minutes}分{seconds}秒"
    hours, minutes = divmod(minutes, 60)
    if seconds == 0:
        return f"{hours}小时{minutes}分" if minutes else f"{hours}小时"
    return f"{hours}小时{minutes}分{seconds}秒"


def _call_summary(doc: Dict[str, Any]) -> str:
    parts: List[str] = []
    col = str(doc.get("colName") or "").strip()
    if col:
        parts.append(col)
    dur = _format_duration_seconds(doc.get("bizDuration"))
    if dur:
        parts.append(f"通话{dur}")
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
    codes: _CodeCache,
    db: Any,
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
                payload=_appointment_payload(sa, codes, db),
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
                "ownerName": 1,
                "ownerPhone": 1,
                "description": 1,
                "depositRatio": 1,
                "exts": 1,
            },
        )
        .sort("createTime", -1)
        .limit(5)
    ):
        at_ms = _parse_utc_naive_ms(doc.get("createTime"))
        if at_ms is None:
            continue
        parsed = _parse_order_doc(doc, codes)
        payload = _quote_payload(doc, codes)
        amt = parsed.get("amount_yuan")
        amt_s = f"{amt:.0f}" if isinstance(amt, (int, float)) else "—"
        pay = parsed.get("pay_state_label") or "—"
        pkgs = "、".join(parsed.get("package_names") or [])
        summary = f"{amt_s}元 · {pay}"
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
                payload=payload,
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


def _form_fields(pairs: List[tuple[str, str]]) -> List[Dict[str, str]]:
    return [
        {"label": label, "value": (value.strip() if value else "—")}
        for label, value in pairs
    ]


def _region_label(codes: _CodeCache, doc: Dict[str, Any]) -> str:
    parts = [
        codes.label(doc.get("province")),
        codes.label(doc.get("city")),
        codes.label(doc.get("district")),
    ]
    return " / ".join(p for p in parts if p) or "—"


def _collect_image_items(raw: Any) -> List[Dict[str, str]]:
    """surveyDrawing / exts.images* → {url, name} 列表（去重）。"""
    out: List[Dict[str, str]] = []
    seen: set[str] = set()

    def add(item: Any) -> None:
        if not isinstance(item, dict):
            return
        url = str(item.get("url") or item.get("path") or "").strip()
        if not url or url in seen:
            return
        seen.add(url)
        out.append({"url": url, "name": str(item.get("name") or "").strip()})

    if isinstance(raw, list):
        for x in raw:
            add(x)
    elif isinstance(raw, dict):
        add(raw)

    return out


def _survey_images(doc: Dict[str, Any]) -> List[Dict[str, str]]:
    images: List[Dict[str, str]] = []
    seen: set[str] = set()
    for batch in [_collect_image_items(doc.get("surveyDrawing"))]:
        for img in batch:
            if img["url"] not in seen:
                seen.add(img["url"])
                images.append(img)
    exts = doc.get("exts") or {}
    if isinstance(exts, dict):
        for key in sorted(exts.keys()):
            if not str(key).startswith("images"):
                continue
            for img in _collect_image_items(exts.get(key)):
                if img["url"] not in seen:
                    seen.add(img["url"])
                    images.append(img)
    return images[:24]


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

    st = str(doc.get("sourceType") or "")
    progress = doc.get("progress")
    progress_s = f"{progress}%" if progress is not None and progress != "" else "—"
    return {
        "fields": _form_fields(
            [
                ("勘察单号", str(doc.get("surveyNum") or "")),
                ("客户姓名", str(doc.get("name") or "")),
                ("联系电话", str(doc.get("phone") or "")),
                ("勘察地址", str(doc.get("address") or "")),
                ("省市区", _region_label(codes, doc)),
                ("勘察部位", "、".join(part_names)),
                ("渗漏原因", "、".join(str(c) for c in causes)),
                ("勘察时间", str(doc.get("surveyTime") or "")),
                ("施工面积", _num(doc.get("squareMeter"))),
                ("平面尺寸", f"{_num(doc.get('length'))} × {_num(doc.get('width'))}"),
                ("进度", progress_s),
                ("服务类型", codes.label(doc.get("serviceType")) or str(doc.get("serviceType") or "")),
                ("线索来源", _SOURCE_TYPE.get(st, st) if st else ""),
                ("负责人", str(doc.get("supervisorName") or "")),
                ("负责人电话", str(doc.get("supervisorPhone") or "")),
                ("勘察单位", str(doc.get("orgName") or "")),
                ("录入人", str(doc.get("createUserName") or "")),
                ("备注", str(doc.get("memo") or "").strip()),
                ("创建时间", _fmt_time(doc.get("createTime"))),
                ("更新时间", _fmt_time(doc.get("updateTime"))),
            ]
        ),
        "images": _survey_images(doc),
    }


def _appointment_payload(sa: Dict[str, Any], codes: _CodeCache, db: Any) -> Dict[str, Any]:
    exts = sa.get("exts") or {}
    prospect = str(exts.get("prospectingTimeStr") or "").strip()
    if not prospect:
        prospect = _fmt_time(exts.get("prospectingTime"))
    subscribe = str(exts.get("subscribeTimeStr") or "").strip()
    if not subscribe:
        subscribe = _fmt_time(exts.get("subscribeTime"))
    apply_s = str(exts.get("applyTimeStr") or "").strip() or _fmt_time(sa.get("applyTime"))
    addr = str(sa.get("address") or exts.get("gpsAddr") or "").strip()
    st = str(exts.get("sourceType") or "")
    leak_raw = exts.get("leakagesite_copy") or exts.get("leakagesite")
    leak_ids = _flatten_leak_codes(leak_raw)
    leak_sites = "、".join(dict.fromkeys(codes.label(i) for i in leak_ids if codes.label(i)))
    channel = _resolve_channel_path(db, sa.get("channel"))
    return {
        "fields": _form_fields(
            [
                ("工单号", str(sa.get("orderNum") or "")),
                ("客户姓名", str(sa.get("name") or "")),
                ("联系电话", str(sa.get("phone") or "")),
                ("上门地址", addr),
                ("渗漏部位", leak_sites),
                ("获客渠道", channel),
                ("线索来源", _SOURCE_TYPE.get(st, st) if st else ""),
                ("服务类型", codes.label(sa.get("serviceType")) or str(sa.get("serviceType") or "")),
                ("勘察上门时间", prospect),
                ("预约提交时间", subscribe),
                ("申请时间", apply_s),
            ]
        ),
    }


def _quote_lines(doc: Dict[str, Any], codes: _CodeCache) -> List[Dict[str, Any]]:
    bp_raw = doc.get("bjProducts")
    if not bp_raw:
        return []
    try:
        bp = json.loads(bp_raw) if isinstance(bp_raw, str) else bp_raw
    except json.JSONDecodeError:
        return []
    if not isinstance(bp, dict):
        return []
    lines: List[Dict[str, Any]] = []
    for item in bp.get("orderList") or []:
        if not isinstance(item, dict):
            continue
        row = _parse_bj_quote_row(item, codes)
        lines.append(quote_line_to_payload(row))
    return lines


def _quote_payload(doc: Dict[str, Any], codes: _CodeCache) -> Dict[str, Any]:
    parsed = _parse_order_doc(doc, codes)
    exts = doc.get("exts") or {}
    amt = parsed.get("amount_yuan")
    amt_s = f"{amt:.0f}" if isinstance(amt, (int, float)) else "—"
    deposit = doc.get("depositRatio")
    deposit_s = f"{float(deposit) * 100:.0f}%" if isinstance(deposit, (int, float)) else "—"
    mail_area = exts.get("mailArea") or exts.get("projectArea") or []
    if isinstance(mail_area, list):
        mail_region = " / ".join(
            dict.fromkeys(codes.label(x) for x in mail_area if codes.label(x))
        )
    else:
        mail_region = str(mail_area or "")
    st = str(exts.get("sourceType") or "")
    return {
        "fields": _form_fields(
            [
                ("报价单号", str(doc.get("orderNumber") or doc.get("_id") or "")),
                ("工单号", str(exts.get("serviceAppointmentNum") or "")),
                ("报价金额", f"{amt_s} 元"),
                ("支付状态", parsed.get("pay_state_label") or "—"),
                ("客户姓名", str(exts.get("clientname") or doc.get("ownerName") or "")),
                ("联系电话", str(exts.get("telphone") or doc.get("ownerPhone") or "")),
                ("项目地址", str(exts.get("projectAddress") or "")),
                ("邮寄地址", str(exts.get("mailAddress") or "")),
                ("邮寄区域", mail_region),
                ("方案套餐", "、".join(parsed.get("package_names") or [])),
                ("维修部位", "、".join(parsed.get("repair_parts") or [])),
                ("施工位置", parsed.get("construction_location") or ""),
                (
                    "施工部位",
                    parsed.get("construction_site")
                    or parsed.get("construction_location")
                    or "",
                ),
                ("部位说明", parsed.get("part_description") or ""),
                ("质保", parsed.get("warranty_label") or ""),
                ("维修面积", parsed.get("maintain_area") or ""),
                ("定金比例", deposit_s),
                ("服务类型", codes.label(exts.get("serviceType")) or str(exts.get("serviceType") or "")),
                ("线索来源", _SOURCE_TYPE.get(st, st) if st else ""),
                ("报价日期", parsed.get("quote_date") or ""),
                ("备注", str(doc.get("description") or "").strip()),
            ]
        ),
        "lines": _quote_lines(doc, codes),
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
                    "name": 1,
                    "phone": 1,
                    "address": 1,
                    "applyTime": 1,
                    "channel": 1,
                    "serviceType": 1,
                    "createTime": 1,
                    "exts": 1,
                },
            )
            if sa:
                events.extend(
                    _milestone_events_from_sa(
                        sa,
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                        order_num=wo.order_num,
                        codes=codes,
                        db=db,
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
                        "name": 1,
                        "phone": 1,
                        "part": 1,
                        "province": 1,
                        "city": 1,
                        "district": 1,
                        "surveyTime": 1,
                        "address": 1,
                        "supervisorName": 1,
                        "supervisorPhone": 1,
                        "progress": 1,
                        "length": 1,
                        "width": 1,
                        "orgName": 1,
                        "createUserName": 1,
                        "serviceType": 1,
                        "sourceType": 1,
                        "squareMeter": 1,
                        "memo": 1,
                        "leakageCause": 1,
                        "surveyDrawing": 1,
                        "exts": 1,
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
                part_s = next(
                    (f["value"] for f in payload["fields"] if f["label"] == "勘察部位"),
                    "—",
                )
                num_s = next(
                    (f["value"] for f in payload["fields"] if f["label"] == "勘察单号"),
                    "—",
                )
                events.append(
                    _event(
                        work_order_id=wid,
                        dedupe_key=dedupe_key,
                        lane="business",
                        kind="survey",
                        at_ms=at_ms,
                        title="勘察",
                        summary=f"{num_s} · {part_s}",
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


def _days_between_trace_times(prev: "ReasoningTrace", cur: "ReasoningTrace") -> int:
    prev_ms = _parse_at_ms(prev.created_at)
    cur_ms = _parse_at_ms(cur.created_at)
    if prev_ms is None or cur_ms is None:
        return 0
    return max(0, int(abs(cur_ms - prev_ms) / 86_400_000))


def _stale_days_at_state(state_at: str, at_ms: int) -> Optional[int]:
    from datetime import datetime

    from ..reprocess.time_trigger import compute_stale_days_from_state_at

    ref = datetime.utcfromtimestamp(at_ms / 1000.0)
    return compute_stale_days_from_state_at(state_at, now=ref)


def _reanalysis_trigger_tags(
    prev_trace: "ReasoningTrace",
    trace: "ReasoningTrace",
    *,
    state_at: str = "",
    interval_days: int = 3,
    step_days: int = 7,
) -> List[str]:
    tags: List[str] = []
    gap = _days_between_trace_times(prev_trace, trace)
    if gap >= interval_days:
        tags.append(f"间隔触发（距上轮 {gap} 天）")
    cur_ms = _parse_at_ms(trace.created_at)
    prev_ms = _parse_at_ms(prev_trace.created_at)
    if cur_ms and prev_ms and state_at:
        stale_now = _stale_days_at_state(state_at, cur_ms)
        stale_prev = _stale_days_at_state(state_at, prev_ms)
        if (
            stale_now is not None
            and stale_prev is not None
            and stale_now >= stale_prev + step_days
        ):
            tags.append(f"滞留加重（{stale_prev}→{stale_now} 天）")
    return tags or ["再分析（规则入池）"]


def _wecom_push_label(log_status: str, *, is_reanalysis: bool) -> str:
    s = (log_status or "").strip()
    if not is_reanalysis:
        if s == "sent":
            return "企微已推送"
        return ""
    return _LOG_STATUS_LABELS.get(s, s)


def _events_for_trace(
    wid: str,
    dedupe_key: str,
    trace: "ReasoningTrace",
    index: int,
    *,
    prev_trace: Optional["ReasoningTrace"] = None,
    state_at: str = "",
    log_status: str = "",
    is_latest: bool = False,
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    trace_ms = _parse_at_ms(trace.created_at) or _parse_at_ms(bj_now().isoformat())
    if trace_ms is None:
        trace_ms = 0

    is_reanalysis = index > 0 or "reanaly" in (trace.mode or "").lower()

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
                        title="系统查证" if not is_reanalysis else "再分析 · 系统查证",
                        summary=verdict[:200] if verdict else "已完成业务查证",
                    )
                )
                break

    parsed = trace.parsed if isinstance(trace.parsed, dict) else {}
    priority = str(parsed.get("优先级") or parsed.get("priority") or "").strip()
    reason = str(parsed.get("原因摘要") or "").strip()
    primary = str(
        (parsed.get("跟进方案") or {}).get("主行动")
        or parsed.get("主行动")
        or reason
        or ""
    ).strip()[:120]

    summary_parts: List[str] = []
    if priority:
        summary_parts.append(f"优先级 {priority}")
    if primary:
        summary_parts.append(primary)
    elif reason:
        summary_parts.append(reason[:100])
    trigger_tags: List[str] = []
    if is_reanalysis and prev_trace is not None:
        trigger_tags = _reanalysis_trigger_tags(
            prev_trace, trace, state_at=state_at or ""
        )
        summary_parts.extend(trigger_tags[:2])

    payload: Dict[str, Any] = {"trace_round": index + 1}
    if trigger_tags:
        payload["trigger_tags"] = trigger_tags
    if is_latest and log_status:
        push = _wecom_push_label(log_status, is_reanalysis=is_reanalysis)
        if push:
            payload["wecom_push"] = push
            summary_parts.append(push)

    events.append(
        _event(
            work_order_id=wid,
            dedupe_key=dedupe_key,
            lane="agent",
            kind="reanalysis" if is_reanalysis else "suggestion",
            at_ms=trace_ms,
            title="再分析 · 跟进建议" if is_reanalysis else "生成跟进建议",
            summary=" · ".join(summary_parts) or "—",
            payload=payload,
        )
    )
    return events


def _inbox_events(
    log_row: Dict[str, Any],
    *,
    work_order_id: str,
    dedupe_key: str,
) -> List[Dict[str, Any]]:
    bucket = str(log_row.get("inbox_bucket") or "active").strip() or "active"
    reason = str(log_row.get("archive_reason") or "").strip()
    if bucket == "active" and not reason:
        return []

    at_ms = _parse_at_ms(log_row.get("reconciled_at"))
    if at_ms is None:
        at_ms = _parse_at_ms(bj_now().isoformat()) or 0

    bucket_label = _INBOX_BUCKET_LABELS.get(bucket, bucket)
    parts: List[str] = []
    if reason:
        parts.append(_ARCHIVE_REASON_LABELS.get(reason, reason))
    mongo_status = str(log_row.get("mongo_status") or "").strip()
    if mongo_status:
        parts.append(f"当前状态：{fsm_status_label(mongo_status)}")
    live = str(log_row.get("live_verdict") or "").replace("【结论】", "").strip()
    if live:
        parts.append(live[:160])

    return [
        _event(
            work_order_id=work_order_id,
            dedupe_key=dedupe_key,
            lane="agent",
            kind="inbox",
            at_ms=at_ms,
            title=f"收件箱 · {bucket_label}",
            summary=" · ".join(parts) if parts else bucket_label,
        )
    ]


def _stale_snapshot_event(
    cfg: "Config",
    log_row: Dict[str, Any],
    *,
    work_order_id: str,
    dedupe_key: str,
    outcome: Any,
) -> Optional[Dict[str, Any]]:
    from ..reprocess.time_trigger import (
        resolve_analyzed_stale_days,
        resolve_current_stale_days,
        should_time_reprocess_log,
    )

    bucket = str(log_row.get("inbox_bucket") or "active").strip() or "active"
    if bucket != "active":
        return None

    now_ms = _parse_at_ms(log_row.get("reconciled_at"))
    if now_ms is None:
        now_ms = _parse_at_ms(bj_now().isoformat()) or 0

    current = resolve_current_stale_days(log_row)
    analyzed = resolve_analyzed_stale_days(log_row)
    parts = [f"当前滞留 {current} 天", f"上次 Agent 分析时 {analyzed} 天"]
    processed_at = str(log_row.get("processed_at") or "").strip()
    if processed_at:
        parts.append(f"分析于 {processed_at[:16].replace('T', ' ')}")
    log_status = str(log_row.get("status") or "").strip()
    if log_status:
        parts.append(_LOG_STATUS_LABELS.get(log_status, log_status))

    pending = should_time_reprocess_log(cfg, log_row, outcome)
    if pending:
        parts.append("已达再分析条件，等待下轮 Agent 入池")

    return _event(
        work_order_id=work_order_id,
        dedupe_key=dedupe_key,
        lane="agent",
        kind="reanalyze_pending" if pending else "stale_snapshot",
        at_ms=now_ms,
        title="待再次分析" if pending else "滞留快照",
        summary=" · ".join(parts),
    )


def _agent_events(
    wo: WorkOrder,
    dedupe_key: str,
    suggestion: FollowUpSuggestion,
    trace: "ReasoningTrace",
    store: "TrackingStore",
    *,
    cfg: Optional["Config"] = None,
    log_row: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    wid = wo.work_order_id

    traces = store.list_traces_for_work_order(wid)
    if not traces:
        traces = [trace]

    state_at = str((log_row or {}).get("state_at") or "")
    log_status = str((log_row or {}).get("status") or "")
    last_idx = len(traces) - 1
    for idx, t in enumerate(traces):
        prev = traces[idx - 1] if idx > 0 else None
        events.extend(
            _events_for_trace(
                wid,
                dedupe_key,
                t,
                idx,
                prev_trace=prev,
                state_at=state_at,
                log_status=log_status,
                is_latest=idx == last_idx,
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

    if log_row and cfg:
        snap = _stale_snapshot_event(
            cfg,
            log_row,
            work_order_id=wid,
            dedupe_key=dedupe_key,
            outcome=outcome,
        )
        if snap:
            events.append(snap)
        events.extend(
            _inbox_events(
                log_row,
                work_order_id=wid,
                dedupe_key=dedupe_key,
            )
        )

    return events


def build_timeline_events(
    cfg: "Config",
    wo: WorkOrder,
    suggestion: FollowUpSuggestion,
    trace: "ReasoningTrace",
    store: "TrackingStore",
    *,
    log_row: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    dedupe_key = wo.dedupe_key or str((log_row or {}).get("dedupe_key") or "")
    ctx = enrich_work_order_context(cfg, wo)
    events = _business_events(cfg, wo, dedupe_key, ctx)
    events.extend(
        _agent_events(
            wo,
            dedupe_key,
            suggestion,
            trace,
            store,
            cfg=cfg,
            log_row=log_row,
        )
    )
    events.sort(key=lambda e: e["at_ms"], reverse=True)
    return events
