"""FS-AOL 主编排：DB 增量轮询 → 推理 → 追踪库 → 企微推送。

链路：GitHub Actions Cron → 增量捞取候选工单 → 推理生成跟进建议
     → 写入追踪库（幂等水位线）→ 企业微信群机器人推送。

领域语义纪律（见 docs/04-domain-semantics.md）：系统码翻译全部收拢在 domain.py（防腐层），
本编排层只说领域语言（WorkOrder / 跟进建议）。
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# ---- 可选依赖：缺失时不影响 dry-run + mock + local 链路 ----
try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover - dotenv 是可选的
    pass

from . import domain
from .config import Config
from .util import env_bool
from .integration.fetch import fetch_completed_work_orders
from .integration.fsm_mongo import resolve_event_statuses
from .tracking.store import TrackingStore
from .runtime.reasoner import reason_follow_up
from .action.card import build_card_markdown, enrich_output_from_trace
from .action.wecom import send_wecom_card
from .reprocess.time_trigger import (
    reanalysis_should_push,
    resolve_analyzed_stale_days,
    resolve_current_stale_days,
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("aol")


def reset_tracking(cfg: Config) -> None:
    """清空本地 sqlite 表数据（不删文件），便于 E2E 反复跑且 GUI 工具可刷新。

    仅允许 TRACKING_SOURCE=local，避免误清 Turso 上的共享数据。
    """
    if cfg.tracking_source != "local":
        raise SystemExit(
            "reset-tracking 仅支持 TRACKING_SOURCE=local。"
            "云库请手动运维或换 TRACKING_LOCAL_PATH 指向临时文件。"
        )
    path = os.path.abspath(cfg.tracking_local_path)
    store = TrackingStore(cfg)
    try:
        n = store.clear_all_data()
    finally:
        store.close()
    logger.info("已清空追踪表数据（%d 行，可重复 E2E）: %s", n, path)


def run(cfg: Optional[Config] = None) -> int:
    cfg = cfg or Config()
    prov, _, _, model, _ = cfg.resolved_llm()
    statuses = resolve_event_statuses(cfg)
    pilot_label = (cfg.pilot_housekeepers or cfg.pilot_housekeeper_ids or "全部").strip()
    logger.info(
        "启动 fs-aol | dry_run=%s fsm=%s tracking=%s llm=%s/%s | "
        "events=%s max_age_days=%d stale_days=%d | pilot=%s | agent=%s | "
        "reanalyze=%s interval=%dd step=%dd cap=%d",
        cfg.dry_run, cfg.fsm_source, cfg.tracking_source, prov, model,
        ",".join(statuses), cfg.fsm_max_age_days, cfg.fsm_stale_days, pilot_label,
        cfg.agent_mode,
        cfg.reanalyze_enabled,
        cfg.reanalyze_interval_days,
        cfg.reanalyze_stale_step_days,
        cfg.reanalyze_max_per_run,
    )

    store = TrackingStore(cfg)
    try:
        time_reprocess_keys = (
            store.get_time_reprocessable_dedupe_keys()
            if cfg.reanalyze_enabled
            else set()
        )
        if time_reprocess_keys:
            logger.info("时间触发再分析入池: %d 条", len(time_reprocess_keys))
        processed_keys = store.effective_processed_keys()
        work_orders = fetch_completed_work_orders(
            cfg,
            processed_keys,
            reprocess_keys=time_reprocess_keys,
        )

        success = 0
        reanalyzed = 0
        failed = 0
        skipped = 0
        total_tokens = 0
        processed = len(work_orders)
        if not work_orders:
            logger.info("本轮无待跟进事件。")
        for wo in work_orders:
            ref = wo.order_num or wo.work_order_id
            is_time_reprocess = wo.dedupe_key in time_reprocess_keys
            try:
                prior_context = store.build_prior_context(wo.dedupe_key)
                if is_time_reprocess:
                    old_log = store.get_follow_up_log(wo.dedupe_key)
                    if old_log:
                        prev_stale = resolve_analyzed_stale_days(old_log)
                        cur_stale = max(wo.stale_days or 0, resolve_current_stale_days(old_log))
                        prior_context = (
                            f"{prior_context}\n\n## 时间上下文（再分析）\n"
                            f"- 上次分析时滞留约 {prev_stale} 天，当前约 {cur_stale} 天\n"
                            "- 请结合最新查证刷新优先级与跟进方案，勿照搬旧结论。"
                        ).strip()
                suggestion, trace = reason_follow_up(cfg, wo, prior_context=prior_context)
                store.log_reasoning_trace(trace)  # 每次推理都落 trace（含失败）
                total_tokens += int(trace.total_tokens or 0)

                if suggestion is None:
                    logger.warning("工单 %s 推理失败(%s)，下轮重试。", ref, trace.error)
                    failed += 1
                    continue

                logger.info(
                    "工单 %s [%s] → %s | %s %dtok %dms",
                    ref,
                    domain.event_type_label(wo.event_type),
                    json.dumps(suggestion.to_display_dict(), ensure_ascii=False),
                    trace.mode,
                    trace.total_tokens,
                    trace.latency_ms,
                )

                if suggestion.needs_follow_up:
                    old_log = (
                        store.get_follow_up_log(wo.dedupe_key)
                        if is_time_reprocess
                        else None
                    )
                    push_card = (
                        not is_time_reprocess
                        or reanalysis_should_push(cfg, old_log, suggestion)
                    )
                    enrich_out = (
                        enrich_output_from_trace(trace)
                        if cfg.agent_mode == "steps"
                        else None
                    )
                    blocker = store.get_latest_blocker(wo.dedupe_key)
                    sent = False
                    if push_card:
                        card = build_card_markdown(
                            wo,
                            suggestion,
                            enrich_output=enrich_out,
                            dedupe_key=wo.dedupe_key,
                            console_base_url=cfg.console_base_url,
                            blocker=blocker,
                            compact=not cfg.dry_run,
                        )
                        sent = send_wecom_card(cfg, card, housekeeper_id=wo.housekeeper_id)
                    if is_time_reprocess:
                        if not push_card:
                            status = "reanalyzed_no_push"
                        elif sent:
                            status = "reanalyzed"
                        else:
                            status = "reanalyzed_send_failed"
                    else:
                        status = "sent" if sent else "send_failed"
                else:
                    status = (
                        "reanalyzed_skipped_no_follow_up"
                        if is_time_reprocess
                        else "skipped_no_follow_up"
                    )

                # 仅成功送达（或明确无需跟进）才记入水位线，
                # 推送失败留待下轮重试 —— 天然的拉取式状态机。
                if status not in ("send_failed", "reanalyzed_send_failed"):
                    store.mark_processed(wo, suggestion, status)
                    try:
                        log_row = store.get_follow_up_log(wo.dedupe_key)
                        if log_row:
                            store.refresh_timeline_for_log(cfg, log_row)
                        else:
                            store.refresh_timeline(cfg, wo, suggestion, trace)
                    except Exception:
                        logger.exception("工单 %s 时间轴物化失败（不影响主流程）。", ref)
                    success += 1
                    if is_time_reprocess:
                        reanalyzed += 1
                else:
                    logger.warning("工单 %s 推送失败，下轮重试。", ref)
                    failed += 1
                if status in ("skipped_no_follow_up", "reanalyzed_skipped_no_follow_up"):
                    skipped += 1
            except Exception:
                logger.exception("工单 %s 处理异常，下轮重试。", ref)
                failed += 1

        if work_orders:
            logger.info(
                "本轮完成：成功 %d / 共 %d（其中时间再分析 %d）",
                success,
                len(work_orders),
                reanalyzed,
            )
        inbox_stats: Dict[str, Any] = {}
        timeline_stats: Dict[str, Any] = {}
        try:
            from .inbox.sync import run_inbox_sync, run_timeline_refresh

            inbox_stats = run_inbox_sync(cfg, store, only_active=True)
            logger.info("收件箱同步: %s", inbox_stats)
            timeline_stats = run_timeline_refresh(cfg, store, only_active=False)
            logger.info("时间轴同步: %s", timeline_stats)
        except Exception:
            logger.exception("收件箱/时间轴同步失败（不影响主流程）。")

        run_summary = {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "processed": processed,
            "success": success,
            "reanalyzed": reanalyzed,
            "failed": failed,
            "skipped": skipped,
            "tokens": total_tokens,
            "inbox_sync": inbox_stats,
            "timeline_sync": timeline_stats,
        }
        logger.info("run_summary %s", json.dumps(run_summary, ensure_ascii=False))
        try:
            store.save_engine_runtime_snapshot(cfg.public_snapshot(), run_summary)
        except Exception:
            logger.exception("引擎运行时快照写入失败（不影响主流程）。")
        return 0
    finally:
        store.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="FS-AOL 跟进行动引擎")
    parser.add_argument(
        "--reset-tracking",
        action="store_true",
        help="运行前清空本地 sqlite 表数据（保留 db 文件，E2E 重复验证用）",
    )
    args = parser.parse_args()
    cfg = Config()
    if args.reset_tracking or env_bool("TRACKING_RESET"):
        reset_tracking(cfg)
    return run(cfg)


if __name__ == "__main__":
    sys.exit(main())
