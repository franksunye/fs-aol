"""v0.2 跟进建议后处理：在不编造事实的前提下补齐 LLM 常漏项。"""

from __future__ import annotations

import copy
import re
from typing import Any, Optional

from ..domain import FollowUpSuggestion, WorkOrder

_VAGUE_ACTIONS = ("准备回访", "建议回访", "回访确认", "进一步沟通")
_HIGH_VALUE_PARTS = ("屋面", "屋顶", "金属屋面")
_NEGATIVE_HINTS = (
    "不满", "投诉", "担心", "顾虑", "质疑", "着急", "尽快", "不接受", "太贵", "偏高",
)
_POSITIVE_HINTS = (
    "认可", "接受", "满意", "同意", "愿意", "配合", "期待", "可安排", "尽快签约",
)
_MONEY_RE = re.compile(r"([\d,]+)\s*元")


def _quote_amount_yuan(enrich_ctx: Any) -> Optional[float]:
    if not enrich_ctx or not getattr(enrich_ctx, "quotes", None):
        return None
    q0 = enrich_ctx.quotes[0] if enrich_ctx.quotes else {}
    amt = q0.get("amount_yuan") if isinstance(q0, dict) else None
    return float(amt) if isinstance(amt, (int, float)) else None


def _quote_pay_state(enrich_ctx: Any) -> str:
    if not enrich_ctx or not getattr(enrich_ctx, "quotes", None):
        return ""
    q0 = enrich_ctx.quotes[0] if enrich_ctx.quotes else {}
    return str(q0.get("pay_state_label") or "") if isinstance(q0, dict) else ""


def _replace_wrong_amounts(text: str, correct_amt: int) -> str:
    """把文本中与查证不符的金额替换为权威金额（防 LLM 误读面积等）。"""

    def repl(m: re.Match[str]) -> str:
        raw = m.group(1).replace(",", "")
        try:
            n = int(float(raw))
        except ValueError:
            return m.group(0)
        if n != correct_amt:
            return f"{correct_amt}元"
        return m.group(0)

    return _MONEY_RE.sub(repl, text or "")


def _ground_to_facts(s: FollowUpSuggestion, enrich_ctx: Any) -> None:
    """强制将可核对字段锚定到 enrich 事实（Fact Snapshot 同源）。"""
    if not enrich_ctx:
        return

    amt = _quote_amount_yuan(enrich_ctx)
    pay = _quote_pay_state(enrich_ctx)
    sit = s.situation

    if enrich_ctx.has_signed_contract:
        sit.quote_status = "已有生效签约"
        s.needs_follow_up = False
    elif enrich_ctx.has_quote and not sit.quote_status:
        sit.quote_status = "已正式报价未签约"

    if enrich_ctx.quotes and isinstance(amt, (int, float)) and amt > 0:
        q0 = enrich_ctx.quotes[0]
        pkgs = "、".join((q0.get("package_names") or [])[:2])
        parts = "、".join((q0.get("repair_parts") or [])[:3])
        amt_int = int(amt)
        sit.amount_plan = f"正式报价{amt_int}元；方案：{pkgs}" if pkgs else f"正式报价{amt_int}元"

        if s.reason_summary:
            s.reason_summary = _replace_wrong_amounts(s.reason_summary, amt_int)
        if s.priority_reasons:
            s.priority_reasons = [
                _replace_wrong_amounts(b, amt_int) for b in s.priority_reasons
            ]
        s.evidence_refs = [
            _replace_wrong_amounts(r, amt_int) for r in (s.evidence_refs or [])
        ]

        pay_tag = f"（{pay}）" if pay else ""
        canonical_quote = f"正式报价{amt_int}元{pay_tag}"
        if parts:
            canonical_quote += f"（{parts}）"
        if not any(str(int(amt_int)) in r for r in (s.evidence_refs or [])):
            s.evidence_refs = [canonical_quote[:120], *(s.evidence_refs or [])][:5]

        if pay and "未支付" in " ".join(s.priority_reasons or []):
            if pay != "未支付":
                s.priority_reasons = [
                    b.replace("未支付", pay) for b in (s.priority_reasons or [])
                ]


def _has_high_value_part(enrich_ctx: Any) -> bool:
    sites = " ".join(getattr(enrich_ctx, "leak_sites", None) or [])
    hints = " ".join(getattr(enrich_ctx, "business_hints", None) or [])
    text = sites + hints
    return any(k in text for k in _HIGH_VALUE_PARTS)


def _evidence_sentiment(text: str) -> Optional[str]:
    t = re.sub(r"\s+", "", text or "")
    if not t:
        return None
    if any(k in t for k in _NEGATIVE_HINTS):
        return "消极"
    if any(k in t for k in _POSITIVE_HINTS):
        return "积极"
    return None


def polish_suggestion(
    wo: WorkOrder,
    enrich_ctx: Any,
    suggestion: FollowUpSuggestion,
) -> FollowUpSuggestion:
    """轻量规则抛光：停留天数、优先级、主行动语气、依据条数。"""
    s = copy.deepcopy(suggestion)
    stale = wo.stale_days or 0
    summary = s.reason_summary or ""
    amt = _quote_amount_yuan(enrich_ctx)
    evidence_text = " ".join([wo.followup_text or "", wo.title or "", wo.summary or ""])

    # 原因摘要补停留天数
    if stale > 0 and f"停留{stale}" not in summary and f"{stale}天" not in summary:
        prefix = f"停留{stale}天，"
        s.reason_summary = prefix + summary

    # 优先级：屋面高客单 + 金额较高
    if enrich_ctx and enrich_ctx.has_quote and _has_high_value_part(enrich_ctx):
        if amt and amt >= 15000 and s.priority == "中":
            s.priority = "高"
    if stale >= 7 and s.priority in ("低", "中"):
        s.priority = "高"
    elif stale >= 3 and s.priority == "低":
        s.priority = "中"

    # 客户情绪：默认中性，除非查证文本有明确证据
    sentiment = _evidence_sentiment(evidence_text)
    s.customer_sentiment = sentiment or "中性"

    # 主行动去虚词
    primary = (s.action_plan.primary_action or "").strip()
    if any(v in primary for v in _VAGUE_ACTIONS) or not primary:
        if enrich_ctx and enrich_ctx.has_signed_contract:
            s.action_plan.primary_action = "核对工单状态与合同是否一致"
        elif enrich_ctx and enrich_ctx.has_quote:
            s.action_plan.primary_action = "电话确认报价并推进签约"
        else:
            s.action_plan.primary_action = "电话了解签约意向并确认是否需补录报价"

    # 优先级依据至少 2 条，不足则从查证补
    basis = list(s.priority_reasons or [])
    if stale > 0 and not any(f"{stale}天" in b or f"停留{stale}" in b for b in basis):
        basis.insert(0, f"已停留{stale}天，待签约停滞")
    if amt and not any(str(int(amt)) in b for b in basis):
        pay = _quote_pay_state(enrich_ctx)
        pay_s = pay or "未支付"
        basis.append(f"正式报价{amt:.0f}元（{pay_s}）")
    for hint in (getattr(enrich_ctx, "business_hints", None) or [])[:1]:
        if hint not in basis:
            basis.append(hint.replace("业务提示：", ""))
    s.priority_reasons = basis[:4]

    # 沟通要点：去掉与本案部位不符的示例残留（如窗户单出现「屋面单」）
    talks = list(s.action_plan.talk_points or [])
    if talks and enrich_ctx and not _has_high_value_part(enrich_ctx):
        talks = [t.replace("屋面单可说明优先排期", "可说明近期排期").replace("屋面单", "本单") for t in talks]
        s.action_plan.talk_points = talks

    # 沟通要点：过短则用模板补全（不编造金额外的事实）
    talks = list(s.action_plan.talk_points or [])
    if len(talks) < 2 and enrich_ctx and enrich_ctx.has_quote:
        amt_s = f"{amt:.0f}元" if amt else "报价"
        talks = [
            f"确认客户是否收到正式报价（{amt_s}）及方案范围",
            "了解是否在比价、装修进度或付款安排上有障碍",
            "明确下一步签约时间与可否优先排期",
        ]
        s.action_plan.talk_points = talks[:4]

    # 引用查证：从 enrich 证据行补；剔除 LLM 编造的业务提示
    real_hints = getattr(enrich_ctx, "business_hints", None) or []
    refs = [
        r
        for r in (s.evidence_refs or [])
        if not (str(r).startswith("业务提示") and real_hints and not any(h in str(r) for h in real_hints))
    ]
    for line in (getattr(enrich_ctx, "evidence_lines", None) or []):
        if line.startswith("业务提示"):
            if line not in refs:
                refs.append(line[:120])
            continue
        if line not in refs and len(refs) < 5:
            refs.append(line[:120])
    s.evidence_refs = refs[:5]

    # 情况判断空字段时从 enrich 填
    sit = s.situation
    if enrich_ctx:
        if not sit.quote_status:
            sit.quote_status = "已正式报价未签约" if enrich_ctx.has_quote else "无正式报价"
        if not sit.amount_plan and enrich_ctx.quotes:
            q0 = enrich_ctx.quotes[0]
            amt = q0.get("amount_yuan")
            pkgs = "、".join((q0.get("package_names") or [])[:2])
            sit.amount_plan = f"{amt:.0f}元；{pkgs}" if isinstance(amt, (int, float)) else pkgs
        if not sit.channel_part:
            parts = []
            if enrich_ctx.channel_label:
                parts.append(enrich_ctx.channel_label)
            if enrich_ctx.leak_sites:
                parts.append("、".join(enrich_ctx.leak_sites))
            sit.channel_part = "；".join(parts)

    # 最后：强制锚定可核对事实（覆盖 LLM 错写的金额/签约态）
    _ground_to_facts(s, enrich_ctx)

    return s
