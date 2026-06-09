"""XLink 主路径事件摄取（防腐层落点）：serviceAppointment → WorkOrder。"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set

from .. import domain
from ..config import Config
from ..domain import WorkOrder
from ..util import parse_csv

logger = logging.getLogger("aol.integration")


def work_order_ids_from_dedupe_keys(dedupe_keys: Set[str]) -> List[str]:
    """从 dedupe_key（EVENT:work_order_id）提取 Mongo _id。"""
    ids: List[str] = []
    for key in dedupe_keys:
        raw = (key or "").strip()
        if not raw:
            continue
        wo_id = raw.split(":", 1)[1] if ":" in raw else raw
        if wo_id and wo_id not in ids:
            ids.append(wo_id)
    return ids


def is_v02_ingestion(cfg: Config) -> bool:
    return (
        bool((cfg.fsm_event_statuses or "").strip())
        or cfg.fsm_stale_days > 0
        or cfg.fsm_max_age_days > 0
    )


def resolve_event_statuses(cfg: Config) -> List[str]:
    raw = (cfg.fsm_event_statuses or "").strip()
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    return [domain.COMPLETED_STATUS]


def resolve_pilot_housekeepers(cfg: Config, db) -> None:
    """解析试点管家 userId；写入 cfg.resolved_pilot_ids / pilot_id_to_name。

    若配置了 FSM_PILOT_HOUSEKEEPERS（生产常用），则忽略 FSM_PILOT_HOUSEKEEPER_IDS，
    避免 dev 残留 ID 与生产姓名试点混用。
    """
    names = parse_csv(cfg.pilot_housekeepers)
    ids = [] if names else parse_csv(cfg.pilot_housekeeper_ids)
    id_to_name: Dict[str, str] = {}

    for uid in ids:
        row = db["user"].find_one({"_id": uid}, {"_id": 1, "name": 1})
        id_to_name[uid] = str((row or {}).get("name") or uid)

    for name in names:
        row = db["user"].find_one({"name": name, "state": 1}, {"_id": 1, "name": 1})
        if not row and "牧" in name:
            row = db["user"].find_one(
                {"name": name.replace("牧", "沐"), "state": 1}, {"_id": 1, "name": 1}
            )
        if not row:
            logger.warning("试点管家未找到（将跳过）: %s", name)
            continue
        uid = str(row["_id"])
        ids.append(uid)
        id_to_name[uid] = str(row.get("name") or name)

    cfg.resolved_pilot_ids = list(dict.fromkeys(ids)) if ids else None
    cfg.pilot_id_to_name = id_to_name
    if cfg.resolved_pilot_ids:
        logger.info(
            "试点管家过滤: %s",
            ", ".join(f"{id_to_name.get(i, i)}({i})" for i in cfg.resolved_pilot_ids),
        )
    elif names or cfg.pilot_housekeeper_ids:
        logger.warning("试点管家配置无效，本轮不捞取工单。")
        cfg.resolved_pilot_ids = []


def _enrich_housekeeper_names(db, work_orders: List[WorkOrder]) -> None:
    ids = list({wo.housekeeper_id for wo in work_orders if wo.housekeeper_id})
    if not ids:
        return
    name_map: Dict[str, str] = {}
    for doc in db["user"].find({"_id": {"$in": ids}}, {"_id": 1, "name": 1}):
        name_map[str(doc["_id"])] = str(doc.get("name") or "")
    for wo in work_orders:
        wo.housekeeper_name = name_map.get(wo.housekeeper_id) or "未分配管家"


def _apply_stale_days(work_orders: List[WorkOrder], *, now: Optional[datetime] = None) -> None:
    now = now or domain.bj_now()
    for wo in work_orders:
        if not wo.completed_at:
            continue
        try:
            raw = wo.completed_at
            if isinstance(raw, datetime):
                ut = raw.replace(tzinfo=None) if raw.tzinfo else raw
            else:
                s = str(raw).replace("Z", "")[:26].replace(" ", "T")
                ut = datetime.fromisoformat(s)
            wo.stale_days = max(0, (now - ut).days)
        except (TypeError, ValueError):
            pass


def _merge_work_orders(
    incremental: List[WorkOrder],
    reprocess: List[WorkOrder],
    *,
    reprocess_keys: Set[str],
) -> List[WorkOrder]:
    """增量捞取 + 再分析补捞合并（按 work_order_id 去重，补捞优先保留）。"""
    by_id: Dict[str, WorkOrder] = {wo.work_order_id: wo for wo in incremental}
    added = 0
    for wo in reprocess:
        if wo.dedupe_key not in reprocess_keys:
            logger.warning(
                "再分析补捞跳过（dedupe_key 不匹配）: %s %s",
                wo.order_num or wo.work_order_id,
                wo.dedupe_key,
            )
            continue
        if wo.work_order_id in by_id:
            continue
        by_id[wo.work_order_id] = wo
        added += 1
    if added:
        logger.info("再分析补捞: %d 条", added)
    return list(by_id.values())


def _fetch_reprocess_from_mongo(
    cfg: Config,
    db,
    coll,
    *,
    statuses: List[str],
    reprocess_keys: Set[str],
    supervisor_ids: Optional[List[str]],
    max_age: int,
) -> List[WorkOrder]:
    """按 work_order_id 定向补捞时间触发再分析候选（不受 FSM_BATCH_LIMIT 约束）。"""
    wo_ids = work_order_ids_from_dedupe_keys(reprocess_keys)
    if not wo_ids:
        return []

    query: Dict[str, object] = {
        "_id": {"$in": wo_ids},
        "state": domain.STATE_ACTIVE,
        "status": {"$in": list(statuses)},
    }
    if max_age > 0:
        query[cfg.fsm_time_field] = {
            "$gte": domain.bj_now() - timedelta(days=max_age),
        }
    if supervisor_ids:
        query["exts.supervisorId"] = {"$in": list(supervisor_ids)}

    docs = list(coll.find(query, domain.SA_PROJECTION))
    found_ids = {str(doc.get("_id")) for doc in docs}
    missing = [wid for wid in wo_ids if wid not in found_ids]
    if missing:
        logger.warning(
            "再分析补捞未命中 Mongo（已离 wedge / 超龄 / 非试点）: %s",
            ", ".join(missing[:5]) + ("…" if len(missing) > 5 else ""),
        )

    work_orders = [domain.work_order_from_sa(doc) for doc in docs]
    _apply_stale_days(work_orders)
    _enrich_housekeeper_names(db, work_orders)
    return [wo for wo in work_orders if wo.dedupe_key in reprocess_keys]


def fetch_from_mongo(
    cfg: Config,
    processed_keys: set[str],
    *,
    reprocess_keys: Optional[Set[str]] = None,
) -> List[WorkOrder]:
    """XLink 主路径：从 serviceAppointment 拉原始行，经防腐层翻译为 WorkOrder。"""
    from pymongo import MongoClient  # 懒加载

    if not cfg.fsm_mongo_url:
        raise ValueError(
            "FSM_SOURCE=mongo 需要配置 FSM_MONGO_URL（见 .env.example / docs/xlink-data.md）"
        )
    statuses = resolve_event_statuses(cfg)
    stale_days = cfg.fsm_stale_days if cfg.fsm_stale_days > 0 else 0
    max_age = cfg.fsm_max_age_days if cfg.fsm_max_age_days > 0 else 0
    lookback = cfg.lookback_hours if (stale_days <= 0 and max_age <= 0) else 0
    mongo_exclude: List[str] = []
    if not is_v02_ingestion(cfg):
        mongo_exclude = [k.split(":", 1)[1] for k in processed_keys if ":" in k]
    client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=8000)
    try:
        db = client[cfg.fsm_mongo_db]
        if cfg.resolved_pilot_ids is None:
            resolve_pilot_housekeepers(cfg, db)
        if cfg.resolved_pilot_ids is not None and len(cfg.resolved_pilot_ids) == 0:
            return []
        supervisor_ids = cfg.resolved_pilot_ids
        coll = db[domain.SA_COLLECTION]
        query = domain.follow_up_events_query(
            event_statuses=statuses,
            stale_days=stale_days,
            max_age_days=max_age,
            lookback_hours=lookback,
            processed_ids=mongo_exclude,
            supervisor_ids=supervisor_ids,
            time_field=cfg.fsm_time_field,
        )
        cursor = (
            coll.find(query, domain.SA_PROJECTION)
            .sort(cfg.fsm_time_field, -1)
            .limit(cfg.fsm_batch_limit)
        )
        work_orders = [domain.work_order_from_sa(doc) for doc in cursor]
        _apply_stale_days(work_orders)
        _enrich_housekeeper_names(db, work_orders)
        if is_v02_ingestion(cfg):
            work_orders = [wo for wo in work_orders if wo.dedupe_key not in processed_keys]

        if reprocess_keys:
            reprocess_wos = _fetch_reprocess_from_mongo(
                cfg,
                db,
                coll,
                statuses=statuses,
                reprocess_keys=reprocess_keys,
                supervisor_ids=supervisor_ids,
                max_age=max_age,
            )
            work_orders = _merge_work_orders(
                work_orders,
                reprocess_wos,
                reprocess_keys=reprocess_keys,
            )
        return work_orders
    finally:
        client.close()
