#!/usr/bin/env python3
"""同步 follow_up_logs.inbox_bucket（只读 Mongo，不跑 LLM）。

用法（仓库根）：
  python scripts/sync_inbox.py
  python scripts/sync_inbox.py --all
  python scripts/sync_inbox.py --order-num GD2026055411
  python scripts/sync_inbox.py --work-order-id 6832118808914840881
  python scripts/sync_inbox.py --dry-run --limit 20
"""

from __future__ import annotations

import argparse
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
logger = logging.getLogger("sync_inbox")


def main() -> int:
    from aol.config import Config
    from aol.inbox.sync import run_inbox_sync, run_timeline_refresh
    from aol.tracking.store import TrackingStore

    parser = argparse.ArgumentParser(description="同步收件箱资格 inbox_bucket")
    parser.add_argument(
        "--all",
        action="store_true",
        help="扫描全部日志（默认仅 active/NULL）",
    )
    parser.add_argument("--order-num", help="指定工单号（可能重复，优先用 --work-order-id）")
    parser.add_argument("--work-order-id", help="指定 Mongo serviceAppointment._id")
    parser.add_argument("--limit", type=int, default=0, help="最多处理 N 条")
    parser.add_argument("--dry-run", action="store_true", help="只打印不落库")
    parser.add_argument(
        "--refresh-timelines",
        action="store_true",
        help="同步后刷新全部工单时间轴（默认仅 cron 自动刷新）",
    )
    parser.add_argument(
        "--timelines-only",
        action="store_true",
        help="仅刷新时间轴，不跑 inbox_bucket 同步",
    )
    args = parser.parse_args()

    limit = args.limit if args.limit > 0 else None
    cfg = Config.load()
    store = TrackingStore(cfg)
    try:
        if not args.timelines_only:
            stats = run_inbox_sync(
                cfg,
                store,
                dry_run=args.dry_run,
                limit=limit,
                order_num=args.order_num,
                work_order_id=args.work_order_id,
                only_active=not args.all and not (args.order_num or args.work_order_id),
            )
            logger.info("inbox 完成: %s", stats)
        if args.refresh_timelines or args.timelines_only:
            tl = run_timeline_refresh(
                cfg,
                store,
                dry_run=args.dry_run,
                limit=limit,
                order_num=args.order_num,
                work_order_id=args.work_order_id,
                only_active=False,
            )
            logger.info("时间轴完成: %s", tl)
    finally:
        store.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
