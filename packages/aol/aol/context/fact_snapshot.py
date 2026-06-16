"""业务事实快照（Fact Snapshot）— 单次 Run 的只读事实锚点。

与 LLM 输出（Cognition）正交：UI 展示金额/签约态应优先读本快照或 timeline 业务轨，
不得把 suggestion 里的推断数字当作记账事实。

Schema: aol.fact_snapshot.v1
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .enrich import EnrichedContext

SCHEMA_V1 = "aol.fact_snapshot.v1"


def build_fact_snapshot(
    ctx: "EnrichedContext",
    *,
    captured_at: str,
) -> Dict[str, Any]:
    """从 enrich 结果提取可冻结、可指纹对比的结构化事实。"""
    q0 = ctx.quotes[0] if ctx.quotes else {}
    c0 = ctx.contracts[0] if ctx.contracts else {}

    quote_amt = q0.get("amount_yuan") if isinstance(q0, dict) else None
    contract_amt = c0.get("amount_yuan") if isinstance(c0, dict) else None
    pay = str(q0.get("pay_state_label") or "") if isinstance(q0, dict) else ""
    pkgs = "、".join(q0.get("package_names") or []) if isinstance(q0, dict) else ""
    parts = "、".join(q0.get("repair_parts") or ctx.leak_sites or []) if isinstance(q0, dict) else ""

    snap: Dict[str, Any] = {
        "schema": SCHEMA_V1,
        "captured_at": captured_at,
        "has_quote": bool(ctx.has_quote),
        "has_signed_contract": bool(ctx.has_signed_contract),
        "quote_amount_yuan": quote_amt,
        "quote_pay_state": pay or None,
        "quote_packages": pkgs or None,
        "repair_parts": parts or None,
        "contract_amount_yuan": contract_amt,
        "channel_label": ctx.channel_label or None,
        "fingerprint": "",
    }
    snap["fingerprint"] = fact_fingerprint(snap)
    return snap


def fact_fingerprint(snapshot: Dict[str, Any]) -> str:
    """稳定指纹：用于检测业务事实是否相对上次 Run 发生漂移。"""
    payload = {
        "has_quote": snapshot.get("has_quote"),
        "has_signed_contract": snapshot.get("has_signed_contract"),
        "quote_amount_yuan": snapshot.get("quote_amount_yuan"),
        "quote_pay_state": snapshot.get("quote_pay_state"),
        "contract_amount_yuan": snapshot.get("contract_amount_yuan"),
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def parse_fact_snapshot_from_trace_steps(steps_json: str) -> Optional[Dict[str, Any]]:
    if not steps_json:
        return None
    try:
        steps = json.loads(steps_json)
    except json.JSONDecodeError:
        return None
    if not isinstance(steps, list):
        return None
    for st in steps:
        if not isinstance(st, dict):
            continue
        if st.get("name") != "enrich_work_order_context":
            continue
        out = st.get("output") or {}
        fs = out.get("fact_snapshot")
        if isinstance(fs, dict) and fs.get("schema") == SCHEMA_V1:
            return fs
    return None
