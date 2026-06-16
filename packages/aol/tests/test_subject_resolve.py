"""subject_resolve：orderNum 重复时须 work_order_id。"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from aol.integration.subject_resolve import (
    load_service_appointment_doc,
    order_num_is_ambiguous,
)


class TestSubjectResolve(unittest.TestCase):
    def test_filter_follow_up_logs_by_work_order_id(self) -> None:
        logs = [
            {"dedupe_key": "a", "work_order_id": "1", "order_num": "GD1"},
            {"dedupe_key": "b", "work_order_id": "2", "order_num": "GD1"},
        ]
        from aol.integration.subject_resolve import filter_follow_up_logs

        out = filter_follow_up_logs(logs, work_order_id="2")
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["dedupe_key"], "b")

    def test_prefers_work_order_id_over_order_num(self) -> None:
        db = MagicMock()
        db.__getitem__.return_value.find_one.return_value = {
            "_id": "wid-1",
            "orderNum": "GD1",
            "state": 1,
        }
        doc = load_service_appointment_doc(
            db, work_order_id="wid-1", order_num="GD-OTHER"
        )
        self.assertEqual(doc["_id"], "wid-1")
        db.__getitem__.return_value.find_one.assert_called()

    def test_ambiguous_order_num_returns_none(self) -> None:
        db = MagicMock()
        coll = db.__getitem__.return_value
        coll.count_documents.return_value = 2
        coll.find.return_value = [{"_id": "a"}, {"_id": "b"}]
        doc = load_service_appointment_doc(db, order_num="GD-DUP")
        self.assertIsNone(doc)
        self.assertTrue(order_num_is_ambiguous(db, "GD-DUP"))

    def test_unique_order_num_ok(self) -> None:
        db = MagicMock()
        coll = db.__getitem__.return_value
        coll.count_documents.return_value = 1
        coll.find_one.return_value = {"_id": "only", "orderNum": "GD-ONE"}
        doc = load_service_appointment_doc(db, order_num="GD-ONE")
        self.assertEqual(doc["_id"], "only")


if __name__ == "__main__":
    unittest.main()
