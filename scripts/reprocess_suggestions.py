#!/usr/bin/env python3
"""对事实漂移 / 建议过期的工单重新推理（更新 suggestion + trace + timeline）。

不推企微（除非显式 --push-wecom）。

用法（仓库根，.env 配置 Turso + Mongo + LLM）：
  python scripts/reprocess_suggestions.py --dry-run
  python scripts/reprocess_suggestions.py --dedupe-key STALE_SIGN_PENDING:6832118808914840881
  python scripts/reprocess_suggestions.py --work-order-id 6832118808914840881 --apply
  python scripts/reprocess_suggestions.py --order-num GD2026062751
  python scripts/reprocess_suggestions.py --apply --limit 20
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_PKG = ROOT / "packages" / "aol"
if str(_PKG) not in sys.path:
    sys.path.insert(0, str(_PKG))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("reprocess_suggestions")


def _load_work_order(cfg, order_num: str, work_order_id: str):
    from aol.integration.subject_resolve import load_work_order as _resolve

    return _resolve(cfg, work_order_id=work_order_id, order_num=order_num)


def main() -> int:
    from aol.config import Config
    from aol.inbox.sync import run_inbox_sync
    from aol.integration.subject_resolve import subject_ref
    from aol.reprocess.candidates import select_reprocess_candidates
    from aol.runtime.reasoner import reason_follow_up
    from aol.tracking.store import TrackingStore

    parser = argparse.ArgumentParser(description="重跑事实漂移 / 过期建议")
    parser.add_argument("--order-num", help="仅处理指定工单号（可能重复，优先用 --work-order-id）")
    parser.add_argument("--work-order-id", help="仅处理指定 Mongo serviceAppointment._id")
    parser.add_argument("--dedupe-key", help="仅处理指定 dedupe_key（推荐）")
    parser.add_argument("--limit", type=int, default=0, help="最多处理 N 条")
    parser.add_argument("--dry-run", action="store_true", help="只列出候选，不写库")
    parser.add_argument("--apply", action="store_true", help="执行重跑并写库")
    parser.add_argument(
        "--push-wecom",
        action="store_true",
        help="重跑后推送企微（默认不推）",
    )
    args = parser.parse_args()

    if not args.dry_run and not args.apply:
        args.dry_run = True
        logger.info("未指定 --apply，默认 dry-run")

    limit = args.limit if args.limit > 0 else None
    cfg = Config.load()
    store = TrackingStore(cfg)
    try:
        candidates = select_reprocess_candidates(
            cfg,
            store,
            order_num=args.order_num,
            work_order_id=args.work_order_id,
            limit=limit,
        )
        if args.dedupe_key:
            candidates = [
                (log, r)
                for log, r in candidates
                if str(log.get("dedupe_key")) == args.dedupe_key
            ]

        if not candidates:
            logger.info("无需要重跑的工单。")
            return 0

        logger.info("候选 %d 条：", len(candidates))
        for log, reason in candidates:
            ref = subject_ref(log)
            logger.info("  - %s  (%s)  reason=%s", ref, log.get("dedupe_key"), reason)

        if args.dry_run:
            return 0

        ok = 0
        fail = 0
        for log, reason in candidates:
            ref = subject_ref(log)
            wo = _load_work_order(
                cfg,
                str(log.get("order_num") or ""),
                str(log.get("work_order_id") or ""),
            )
            if wo is None:
                logger.warning("跳过 %s：Mongo 无工单", ref)
                fail += 1
                continue
            wo.event_type = str(log.get("event_type") or wo.event_type or "")
            try:
                prior = store.build_prior_context(wo.dedupe_key)
                prior = (
                    f"{prior}\n\n## 再分析（{reason}）\n"
                    "- 业务事实相对上次 Agent 运行已变化\n"
                    "- 必须以最新系统查证为准刷新建议"
                ).strip()
                suggestion, trace = reason_follow_up(cfg, wo, prior_context=prior)
                store.log_reasoning_trace(trace)
                if suggestion is None:
                    logger.warning("推理失败: %s — %s", ref, trace.error)
                    fail += 1
                    continue

                status = "reprocessed"
                if args.push_wecom and suggestion.needs_follow_up:
                    from aol.action.card import build_card_markdown, enrich_output_from_trace
                    from aol.action.wecom import send_wecom_card

                    enrich_out = enrich_output_from_trace(trace)
                    blocker = store.get_latest_blocker(wo.dedupe_key)
                    card = build_card_markdown(
                        wo,
                        suggestion,
                        enrich_output=enrich_out,
                        dedupe_key=wo.dedupe_key,
                        console_base_url=cfg.console_base_url,
                        blocker=blocker,
                        compact=not cfg.dry_run,
                    )
                    if send_wecom_card(cfg, card, housekeeper_id=wo.housekeeper_id):
                        status = "reprocessed_sent"
                    else:
                        status = "reprocessed_send_failed"

                store.mark_processed(wo, suggestion, status)
                log_row = store.get_follow_up_log(wo.dedupe_key)
                if log_row:
                    store.refresh_timeline_for_log(cfg, log_row)
                run_inbox_sync(
                    cfg,
                    store,
                    work_order_id=str(log.get("work_order_id") or ""),
                )
                logger.info(
                    "已重跑 %s → %s",
                    ref,
                    json.dumps(suggestion.to_display_dict(), ensure_ascii=False)[:200],
                )
                ok += 1
            except Exception:
                logger.exception("重跑失败: %s", ref)
                fail += 1

        logger.info("完成：成功 %d / 失败 %d", ok, fail)
        return 0 if fail == 0 else 1
    finally:
        store.close()


if __name__ == "__main__":
    raise SystemExit(main())
