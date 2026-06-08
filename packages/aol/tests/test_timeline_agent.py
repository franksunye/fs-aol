"""时间轴 Agent 轨：归档、滞留快照、再分析历史。"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from aol.config import Config
from aol.context.timeline import build_timeline_events
from aol.domain import EVENT_STALE_SIGN_PENDING, FollowUpSuggestion, WorkOrder, bj_now
from aol.tracking.trace import ReasoningTrace


class TimelineAgentTests(unittest.TestCase):
    def test_inbox_archive_event_in_timeline(self) -> None:
        cfg = Config()
        wo = WorkOrder(
            work_order_id="SA-1",
            order_num="GD20260510028",
            event_type=EVENT_STALE_SIGN_PENDING,
        )
        dk = f"{EVENT_STALE_SIGN_PENDING}:SA-1"
        suggestion = FollowUpSuggestion(needs_follow_up=True, priority="中")
        trace = ReasoningTrace(
            work_order_id="SA-1",
            mode="steps_llm_hunyuan",
            created_at=bj_now().isoformat(),
            parsed=suggestion.to_display_dict(),
        )
        log_row = {
            "dedupe_key": dk,
            "inbox_bucket": "archived",
            "archive_reason": "signed_contract",
            "reconciled_at": bj_now().isoformat(),
            "mongo_status": "206",
            "live_verdict": "已有生效签约",
            "status": "sent",
            "processed_at": bj_now().isoformat(),
            "state_at": bj_now().isoformat(),
            "analyzed_stale_days": 1,
        }
        store = MagicMock()
        store.list_traces_for_work_order.return_value = [trace]
        store.get_latest_outcome.return_value = None
        store.get_latest_blocker.return_value = None

        with patch("aol.context.timeline.enrich_work_order_context") as mock_enrich:
            mock_enrich.return_value = MagicMock(
                contracts=[],
                quotes=[],
                has_quote=False,
                has_signed_contract=True,
            )
            with patch("aol.context.timeline._business_events", return_value=[]):
                events = build_timeline_events(
                    cfg, wo, suggestion, trace, store, log_row=log_row
                )

        kinds = {e["kind"] for e in events}
        self.assertIn("inbox", kinds)
        inbox = next(e for e in events if e["kind"] == "inbox")
        self.assertIn("归档", inbox["title"])
        self.assertIn("签约", inbox["summary"])

    def test_stale_snapshot_for_active_pending_reanalysis(self) -> None:
        cfg = Config()
        cfg.reanalyze_interval_days = 3
        wo = WorkOrder(
            work_order_id="SA-2",
            order_num="GD-X",
            event_type=EVENT_STALE_SIGN_PENDING,
        )
        dk = f"{EVENT_STALE_SIGN_PENDING}:SA-2"
        suggestion = FollowUpSuggestion(needs_follow_up=True, priority="中")
        trace = ReasoningTrace(
            work_order_id="SA-2",
            mode="steps_llm_hunyuan",
            created_at=bj_now().isoformat(),
            parsed=suggestion.to_display_dict(),
        )
        from datetime import timedelta

        now = bj_now()
        log_row = {
            "dedupe_key": dk,
            "event_type": EVENT_STALE_SIGN_PENDING,
            "inbox_bucket": "active",
            "status": "sent",
            "processed_at": (now - timedelta(days=5)).isoformat(),
            "state_at": (now - timedelta(days=9)).isoformat(),
            "analyzed_stale_days": 1,
            "reconciled_at": now.isoformat(),
            "suggestion": suggestion.to_dict(),
        }
        store = MagicMock()
        store.list_traces_for_work_order.return_value = [trace]
        store.get_latest_outcome.return_value = None
        store.get_latest_blocker.return_value = None

        with patch("aol.context.timeline.enrich_work_order_context") as mock_enrich:
            mock_enrich.return_value = MagicMock(contracts=[], quotes=[])
            with patch("aol.context.timeline._business_events", return_value=[]):
                events = build_timeline_events(
                    cfg, wo, suggestion, trace, store, log_row=log_row
                )

        kinds = {e["kind"] for e in events}
        self.assertIn("reanalyze_pending", kinds)


if __name__ == "__main__":
    unittest.main()
