"""事件摄取分发：根据 FSM_SOURCE 选择 mock / mongo。"""

from __future__ import annotations

import logging
from typing import List, Optional, Set

from ..config import Config
from ..domain import WorkOrder
from .fsm_mock import fetch_mock
from .fsm_mongo import fetch_from_mongo

logger = logging.getLogger("aol.integration")


def _fetch_mock_with_reprocess(
    cfg: Config,
    processed_keys: set[str],
    reprocess_keys: Set[str],
) -> List[WorkOrder]:
    work_orders = fetch_mock(processed_keys)
    if not reprocess_keys:
        return work_orders
    raw = (cfg.fsm_event_statuses or "").strip()
    if not raw:
        return work_orders
    statuses = [s.strip() for s in raw.split(",") if s.strip()]
    from .. import domain

    extra = domain.mock_follow_up_work_orders([], event_statuses=statuses)
    by_id = {wo.work_order_id: wo for wo in work_orders}
    added = 0
    for wo in extra:
        if wo.dedupe_key not in reprocess_keys or wo.work_order_id in by_id:
            continue
        by_id[wo.work_order_id] = wo
        added += 1
    if added:
        logger.info("再分析补捞: %d 条", added)
    return list(by_id.values())


def fetch_completed_work_orders(
    cfg: Config,
    processed_keys: set[str],
    *,
    reprocess_keys: Optional[Set[str]] = None,
) -> List[WorkOrder]:
    """捞取 follow-up 事件候选工单（v0.2：按 dedupe_key 去重）。

    reprocess_keys：时间触发再分析候选；会从 Mongo 按 work_order_id 补捞，
    避免仅依赖 updateTime 排序 + FSM_BATCH_LIMIT 时漏掉旧单。
    """
    keys = reprocess_keys or set()
    if cfg.fsm_source == "mock":
        work_orders = _fetch_mock_with_reprocess(cfg, processed_keys, keys)
    elif cfg.fsm_source == "mongo":
        work_orders = fetch_from_mongo(cfg, processed_keys, reprocess_keys=keys or None)
    else:
        raise ValueError(f"未知 FSM_SOURCE: {cfg.fsm_source}")

    reprocess_count = sum(1 for wo in work_orders if wo.dedupe_key in keys)
    if keys:
        logger.info(
            "捞取到 %d 条待跟进（已处理 %d 个 dedupe_key，再分析 %d 条）",
            len(work_orders),
            len(processed_keys),
            reprocess_count,
        )
    else:
        logger.info(
            "捞取到 %d 条待跟进（已处理 %d 个 dedupe_key）",
            len(work_orders),
            len(processed_keys),
        )
    return work_orders
