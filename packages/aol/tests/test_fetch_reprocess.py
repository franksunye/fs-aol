"""再分析补捞：Mongo 定向 fetch 单测。"""

from __future__ import annotations

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from aol.config import Config
from aol.domain import EVENT_STALE_SIGN_PENDING, bj_now
from aol.integration.fsm_mongo import (
    _merge_work_orders,
    fetch_from_mongo,
    work_order_ids_from_dedupe_keys,
)
from aol.integration.fetch import fetch_completed_work_orders


def _sa_doc(
    wo_id: str,
    order_num: str,
    *,
    status: str = "206",
    supervisor_id: str = "3439283044423912324",
    update_time: datetime | None = None,
) -> dict:
    ut = update_time or bj_now()
    return {
        "_id": wo_id,
        "orderNum": order_num,
        "status": status,
        "state": 1,
        "city": "110100",
        "serviceType": "40",
        "title": f"工单 {order_num}",
        "describe": "待签约",
        "name": "测试",
        "phone": "138****0000",
        "updateTime": ut,
        "exts": {"supervisorId": supervisor_id},
    }


class WorkOrderIdsFromDedupeKeysTests(unittest.TestCase):
    def test_parses_event_prefixed_keys(self) -> None:
        keys = {
            "STALE_SIGN_PENDING:6046079617042170257",
            "STALE_SIGN_PENDING:8539758789728945149",
        }
        self.assertEqual(
            work_order_ids_from_dedupe_keys(keys),
            ["6046079617042170257", "8539758789728945149"],
        )


class MergeWorkOrdersTests(unittest.TestCase):
    def test_merge_adds_reprocess_outside_incremental(self) -> None:
        from aol.domain import WorkOrder

        inc = [
            WorkOrder(
                work_order_id="new-1",
                order_num="GD-NEW",
                event_type=EVENT_STALE_SIGN_PENDING,
            )
        ]
        repro = [
            WorkOrder(
                work_order_id="old-1",
                order_num="GD-OLD",
                event_type=EVENT_STALE_SIGN_PENDING,
            )
        ]
        merged = _merge_work_orders(
            inc,
            repro,
            reprocess_keys={f"{EVENT_STALE_SIGN_PENDING}:old-1"},
        )
        self.assertEqual({wo.work_order_id for wo in merged}, {"new-1", "old-1"})

    def test_merge_skips_mismatched_dedupe_key(self) -> None:
        from aol.domain import WorkOrder

        repro = [
            WorkOrder(
                work_order_id="old-1",
                order_num="GD-OLD",
                event_type="OTHER_EVENT",
            )
        ]
        merged = _merge_work_orders(
            [],
            repro,
            reprocess_keys={f"{EVENT_STALE_SIGN_PENDING}:old-1"},
        )
        self.assertEqual(merged, [])


class FetchReprocessMongoTests(unittest.TestCase):
    def _cfg(self) -> Config:
        cfg = Config()
        cfg.fsm_mongo_url = "mongodb://mock"
        cfg.fsm_mongo_db = "xlink"
        cfg.fsm_event_statuses = "206"
        cfg.fsm_max_age_days = 14
        cfg.fsm_batch_limit = 3
        cfg.pilot_housekeeper_ids = "3439283044423912324"
        cfg.pilot_housekeepers = ""
        return cfg

    @patch("pymongo.MongoClient")
    def test_reprocess_fetched_when_incremental_batch_full(self, mock_client_cls) -> None:
        """增量 top-N 已满且均为已处理时，再分析旧单仍应补捞。"""
        cfg = self._cfg()
        now = bj_now()
        fresh_docs = [
            _sa_doc(f"new-{i}", f"GD-NEW-{i}", update_time=now - timedelta(hours=i))
            for i in range(3)
        ]
        stale_doc = _sa_doc(
            "6046079617042170257",
            "GD20260510028",
            update_time=now - timedelta(days=10),
        )
        reprocess_key = f"{EVENT_STALE_SIGN_PENDING}:6046079617042170257"
        processed = {f"{EVENT_STALE_SIGN_PENDING}:new-{i}" for i in range(3)}

        mock_client = MagicMock()
        mock_db = MagicMock()
        mock_coll = MagicMock()
        mock_user = MagicMock(find=MagicMock(return_value=[]))
        mock_db.__getitem__.side_effect = lambda name: {
            "serviceAppointment": mock_coll,
            "user": mock_user,
        }[name]
        mock_client.__getitem__.side_effect = lambda name: mock_db if name == "xlink" else (_ for _ in ()).throw(KeyError(name))
        mock_client_cls.return_value = mock_client

        def coll_find(query, projection):
            if "_id" in query and "$in" in query["_id"]:
                return [stale_doc]
            cursor = MagicMock()
            cursor.sort.return_value = cursor
            cursor.limit.return_value = fresh_docs
            return cursor

        mock_coll.find.side_effect = coll_find

        with patch(
            "aol.integration.fsm_mongo.resolve_pilot_housekeepers",
            side_effect=lambda c, db: setattr(
                c,
                "resolved_pilot_ids",
                ["3439283044423912324"],
            ),
        ):
            result = fetch_from_mongo(
                cfg,
                processed,
                reprocess_keys={reprocess_key},
            )

        order_nums = {wo.order_num for wo in result}
        self.assertIn("GD20260510028", order_nums)
        self.assertEqual(len(result), 1)

    @patch("pymongo.MongoClient")
    def test_fetch_completed_wires_reprocess_keys(self, mock_client_cls) -> None:
        cfg = self._cfg()
        cfg.fsm_source = "mongo"
        now = bj_now()
        stale_doc = _sa_doc(
            "6046079617042170257",
            "GD20260510028",
            update_time=now - timedelta(days=10),
        )
        reprocess_key = f"{EVENT_STALE_SIGN_PENDING}:6046079617042170257"

        mock_client = MagicMock()
        mock_db = MagicMock()
        mock_coll = MagicMock()
        mock_user = MagicMock(find=MagicMock(return_value=[]))
        mock_db.__getitem__.side_effect = lambda name: {
            "serviceAppointment": mock_coll,
            "user": mock_user,
        }[name]
        mock_client.__getitem__.side_effect = lambda name: mock_db if name == "xlink" else (_ for _ in ()).throw(KeyError(name))
        mock_client_cls.return_value = mock_client

        def coll_find(query, projection):
            if "_id" in query and "$in" in query["_id"]:
                return [stale_doc]
            cursor = MagicMock()
            cursor.sort.return_value = cursor
            cursor.limit.return_value = []
            return cursor

        mock_coll.find.side_effect = coll_find

        with patch(
            "aol.integration.fsm_mongo.resolve_pilot_housekeepers",
            side_effect=lambda c, db: setattr(
                c,
                "resolved_pilot_ids",
                ["3439283044423912324"],
            ),
        ):
            result = fetch_completed_work_orders(
                cfg,
                {reprocess_key},
                reprocess_keys={reprocess_key},
            )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].order_num, "GD20260510028")


if __name__ == "__main__":
    unittest.main()
