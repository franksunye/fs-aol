"""XLink Subject 解析：脏数据下 orderNum 非唯一，平台 SSOT 为 work_order_id。

上游 API 可能将同一 saNum 写入多条 serviceAppointment（见 PUB-23 §8）。
引擎 / 脚本 / enrich 必须通过本模块定位 Mongo 文档，禁止裸 find_one(orderNum)。
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ..config import Config

logger = logging.getLogger("aol.integration.subject_resolve")

SA_COLLECTION = "serviceAppointment"


def subject_ref(log: Dict[str, Any]) -> str:
    """运维日志用：工单号 + work_order_id 尾号。"""
    onum = str(log.get("order_num") or "").strip()
    wid = str(log.get("work_order_id") or "").strip()
    if onum and wid:
        return f"{onum} · {wid[-6:]}"
    return onum or wid or "—"


def filter_follow_up_logs(
    logs: List[Dict[str, Any]],
    *,
    dedupe_key: str = "",
    work_order_id: str = "",
    order_num: str = "",
) -> List[Dict[str, Any]]:
    """按 Turso 追踪键过滤；order_num 可能命中多条。"""
    dk = (dedupe_key or "").strip()
    wid = (work_order_id or "").strip()
    onum = (order_num or "").strip()
    if dk:
        return [r for r in logs if str(r.get("dedupe_key")) == dk]
    if wid:
        return [r for r in logs if str(r.get("work_order_id")) == wid]
    if onum:
        matched = [r for r in logs if str(r.get("order_num")) == onum]
        if len(matched) > 1:
            logger.warning(
                "orderNum %s 匹配 %d 条 follow_up_logs，将全部处理；"
                "建议改用 --work-order-id 或 --dedupe-key",
                onum,
                len(matched),
            )
        return matched
    return logs


def count_active_by_order_num(db: Any, order_num: str) -> int:
    if not order_num:
        return 0
    return int(
        db[SA_COLLECTION].count_documents({"orderNum": order_num, "state": 1})
    )


def list_active_ids_by_order_num(db: Any, order_num: str) -> List[str]:
    if not order_num:
        return []
    cursor = db[SA_COLLECTION].find(
        {"orderNum": order_num, "state": 1},
        {"_id": 1},
    )
    return [str(d["_id"]) for d in cursor]


def order_num_is_ambiguous(db: Any, order_num: str) -> bool:
    return count_active_by_order_num(db, order_num) > 1


def load_service_appointment_doc(
    db: Any,
    *,
    work_order_id: str = "",
    order_num: str = "",
    projection: Optional[Dict[str, int]] = None,
) -> Optional[Dict[str, Any]]:
    """定位 serviceAppointment。优先 work_order_id；仅 order_num 时若多条 active 则返回 None 并打日志。"""
    wid = (work_order_id or "").strip()
    onum = (order_num or "").strip()

    if wid:
        doc = db[SA_COLLECTION].find_one({"_id": wid, "state": 1}, projection)
        if doc is None:
            doc = db[SA_COLLECTION].find_one({"_id": wid}, projection)
        return doc

    if not onum:
        return None

    n = count_active_by_order_num(db, onum)
    if n == 0:
        return db[SA_COLLECTION].find_one({"orderNum": onum, "state": 1}, projection)
    if n == 1:
        return db[SA_COLLECTION].find_one({"orderNum": onum, "state": 1}, projection)

    ids = list_active_ids_by_order_num(db, onum)
    logger.warning(
        "orderNum %s 对应 %d 条 active SA，拒绝猜测；请使用 work_order_id。ids=%s",
        onum,
        n,
        ids[:5],
    )
    return None


def load_work_order(
    cfg: "Config",
    *,
    work_order_id: str = "",
    order_num: str = "",
):
    """返回 domain.WorkOrder；Mongo 未命中时返回 None。"""
    from datetime import datetime as dt

    from pymongo import MongoClient

    from .. import domain
    from .fsm_mongo import _enrich_housekeeper_names, resolve_pilot_housekeepers

    if cfg.fsm_source != "mongo" or not cfg.fsm_mongo_url:
        return None

    client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=8000)
    try:
        db = client[cfg.fsm_mongo_db]
        doc = load_service_appointment_doc(
            db,
            work_order_id=work_order_id,
            order_num=order_num,
            projection=domain.SA_PROJECTION,
        )
        if not doc:
            return None
        wo = domain.work_order_from_sa(doc)
        ut = doc.get("updateTime")
        if isinstance(ut, dt):
            wo.stale_days = max(0, (domain.bj_now() - ut.replace(tzinfo=None)).days)
        resolve_pilot_housekeepers(cfg, db)
        _enrich_housekeeper_names(db, [wo])
        return wo
    finally:
        client.close()
