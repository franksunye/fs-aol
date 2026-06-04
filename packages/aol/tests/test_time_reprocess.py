"""时间触发再分析规则单测。"""

from __future__ import annotations

import unittest
from datetime import timedelta

from aol.config import Config
from aol.domain import EVENT_STALE_SIGN_PENDING, bj_now
from aol.reprocess.time_trigger import (
    compute_stale_days_from_state_at,
    reanalysis_should_push,
    should_time_reprocess_log,
)
from aol.tracking.store import OutcomeRecord


class TimeReprocessTests(unittest.TestCase):
    def _cfg(self, **overrides) -> Config:
        base = Config()
        for k, v in overrides.items():
            setattr(base, k, v)
        return base

    def test_stale_days_from_state_at(self) -> None:
        now = bj_now()
        state_at = (now - timedelta(days=10)).isoformat()
        self.assertEqual(compute_stale_days_from_state_at(state_at, now=now), 10)

    def test_interval_triggers_reprocess(self) -> None:
        now = bj_now()
        log = {
            "event_type": EVENT_STALE_SIGN_PENDING,
            "inbox_bucket": "active",
            "suggestion": '{"需要跟进": true, "优先级": "中"}',
            "processed_at": (now - timedelta(days=4)).isoformat(),
            "state_at": (now - timedelta(days=12)).isoformat(),
            "analyzed_stale_days": 12,
        }
        self.assertTrue(
            should_time_reprocess_log(self._cfg(), log, None, now=now)
        )

    def test_stale_step_triggers_reprocess(self) -> None:
        now = bj_now()
        log = {
            "event_type": EVENT_STALE_SIGN_PENDING,
            "inbox_bucket": "active",
            "suggestion": '{"需要跟进": true, "优先级": "中", "原因摘要": "停留7天"}',
            "processed_at": now.isoformat(),
            "state_at": (now - timedelta(days=15)).isoformat(),
            "analyzed_stale_days": 7,
        }
        self.assertTrue(
            should_time_reprocess_log(self._cfg(), log, None, now=now)
        )

    def test_outcome_modified_blocks(self) -> None:
        now = bj_now()
        log = {
            "event_type": EVENT_STALE_SIGN_PENDING,
            "inbox_bucket": "active",
            "suggestion": '{"需要跟进": true}',
            "processed_at": (now - timedelta(days=5)).isoformat(),
        }
        outcome = OutcomeRecord("k", "w", "modified", "", "", "")
        self.assertFalse(
            should_time_reprocess_log(self._cfg(), log, outcome, now=now)
        )

    def test_reanalysis_push_only_on_priority_up(self) -> None:
        cfg = self._cfg(reanalyze_push=True, reanalyze_push_on_same_priority=False)
        old = {"suggestion": '{"需要跟进": true, "优先级": "高"}'}
        from aol.domain import FollowUpSuggestion

        same = FollowUpSuggestion(needs_follow_up=True, priority="高")
        low = FollowUpSuggestion(needs_follow_up=True, priority="低")
        self.assertFalse(reanalysis_should_push(cfg, old, same))
        self.assertFalse(reanalysis_should_push(cfg, old, low))
        old_mid = {"suggestion": '{"需要跟进": true, "优先级": "中"}'}
        higher = FollowUpSuggestion(needs_follow_up=True, priority="高")
        self.assertTrue(reanalysis_should_push(cfg, old_mid, higher))


if __name__ == "__main__":
    unittest.main()
