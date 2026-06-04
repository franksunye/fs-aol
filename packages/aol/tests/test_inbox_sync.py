"""收件箱 reconcile：离 wedge / 已签约须归档。"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from aol.config import Config
from aol.inbox.sync import (
    BUCKET_ACTIVE,
    BUCKET_ARCHIVED,
    REASON_LEFT_WEDGE,
    REASON_SIGNED_CONTRACT,
    reconcile_inbox_row,
)


class InboxReconcileTests(unittest.TestCase):
    def _cfg_206(self) -> Config:
        cfg = Config()
        cfg.fsm_event_statuses = "206"
        return cfg

    def test_left_wedge_archives_when_status_not_in_wedge(self) -> None:
        cfg = self._cfg_206()
        log = {"suggestion": {"需要跟进": True}}
        sa = {"_id": "SA-1", "status": "300", "orderNum": "GD1"}
        state = reconcile_inbox_row(cfg, log, None, sa, wedge_statuses=["206"])
        self.assertEqual(state.bucket, BUCKET_ARCHIVED)
        self.assertEqual(state.reason, REASON_LEFT_WEDGE)
        self.assertEqual(state.mongo_status, "300")

    def test_in_wedge_stays_active_without_signed(self) -> None:
        cfg = self._cfg_206()
        log = {"suggestion": {"需要跟进": True}}
        sa = {"_id": "SA-2", "status": "206", "orderNum": "GD2"}
        ctx = MagicMock(
            has_signed_contract=False,
            has_quote=False,
            quotes=[],
            business_verdict="",
        )
        with patch("aol.inbox.sync.enrich_work_order_context", return_value=ctx):
            state = reconcile_inbox_row(cfg, log, None, sa, wedge_statuses=["206"])
        self.assertEqual(state.bucket, BUCKET_ACTIVE)

    def test_signed_archives_even_in_wedge(self) -> None:
        cfg = self._cfg_206()
        log = {"suggestion": {"需要跟进": True}}
        sa = {"_id": "SA-3", "status": "206", "orderNum": "GD3"}
        ctx = MagicMock(
            has_signed_contract=True,
            has_quote=False,
            quotes=[],
            business_verdict="【结论】已签约",
        )
        with patch("aol.inbox.sync.enrich_work_order_context", return_value=ctx):
            state = reconcile_inbox_row(cfg, log, None, sa, wedge_statuses=["206"])
        self.assertEqual(state.bucket, BUCKET_ARCHIVED)
        self.assertEqual(state.reason, REASON_SIGNED_CONTRACT)


if __name__ == "__main__":
    unittest.main()
