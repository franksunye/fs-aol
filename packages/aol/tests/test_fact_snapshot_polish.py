"""Fact snapshot + polish grounding tests."""

from __future__ import annotations

import unittest
from types import SimpleNamespace

from aol.context.enrich import EnrichedContext
from aol.context.fact_snapshot import build_fact_snapshot, fact_fingerprint
from aol.decision.polish import polish_suggestion
from aol.domain import FollowUpSuggestion, WorkOrder


class FactSnapshotTests(unittest.TestCase):
    def test_fingerprint_changes_when_amount_changes(self) -> None:
        ctx = EnrichedContext(work_order_id="w1")
        ctx.quotes = [{"amount_yuan": 10000.0, "pay_state_label": "未支付"}]
        ctx.has_quote = True
        snap_a = build_fact_snapshot(ctx, captured_at="t1")
        ctx.quotes = [{"amount_yuan": 120000.0, "pay_state_label": "未支付"}]
        snap_b = build_fact_snapshot(ctx, captured_at="t2")
        self.assertNotEqual(snap_a["fingerprint"], snap_b["fingerprint"])


class PolishGroundingTests(unittest.TestCase):
    def test_replaces_wrong_llm_amount(self) -> None:
        wo = WorkOrder(
            work_order_id="w1",
            order_num="GD1",
            event_type="STALE_SIGN_PENDING",
            stale_days=3,
        )
        enrich = EnrichedContext(work_order_id="w1")
        enrich.quotes = [
            {
                "amount_yuan": 10000.0,
                "pay_state_label": "已付首付款",
                "package_names": ["X2-P-热施工"],
                "repair_parts": ["屋面"],
            }
        ]
        enrich.has_quote = True
        enrich.leak_sites = ["屋面"]

        raw = FollowUpSuggestion.from_dict(
            {
                "规格版本": "v0.2",
                "需要跟进": True,
                "优先级": "高",
                "客户情绪": "中性",
                "原因摘要": "已正式报价120000元（屋面），需推进签约。",
                "优先级依据": ["正式报价120000元未支付"],
                "情况判断": {
                    "商机阶段": "待签约",
                    "报价状态": "已正式报价未签约",
                    "金额与方案": "正式报价120000元；X2-P-热施工",
                    "渠道与部位": "400；屋面",
                },
                "跟进方案": {
                    "主行动": "电话回访",
                    "沟通要点": ["确认120000元报价"],
                    "避免事项": [],
                },
                "引用查证": ["已正式报价 120000元（屋面）"],
            }
        )
        out = polish_suggestion(wo, enrich, raw)
        self.assertIn("10000", out.reason_summary)
        self.assertNotIn("120000", out.reason_summary)
        self.assertIn("10000", out.situation.amount_plan)
        self.assertTrue(
            any("10000" in r for r in out.evidence_refs),
            out.evidence_refs,
        )

    def test_signed_contract_overrides_quote_status(self) -> None:
        wo = WorkOrder(work_order_id="w1", order_num="GD1", event_type="STALE_SIGN_PENDING")
        enrich = EnrichedContext(work_order_id="w1")
        enrich.has_signed_contract = True
        enrich.has_quote = True
        enrich.quotes = [{"amount_yuan": 10000.0, "pay_state_label": "已付首付款"}]
        raw = FollowUpSuggestion.from_dict(
            {
                "规格版本": "v0.2",
                "需要跟进": True,
                "优先级": "高",
                "客户情绪": "中性",
                "原因摘要": "待签约",
                "优先级依据": [],
                "情况判断": {
                    "商机阶段": "待签约",
                    "报价状态": "已正式报价未签约",
                    "金额与方案": "",
                    "渠道与部位": "",
                },
                "跟进方案": {"主行动": "回访", "沟通要点": [], "避免事项": []},
                "引用查证": [],
            }
        )
        out = polish_suggestion(wo, enrich, raw)
        self.assertEqual(out.situation.quote_status, "已有生效签约")
        self.assertFalse(out.needs_follow_up)


if __name__ == "__main__":
    unittest.main()
