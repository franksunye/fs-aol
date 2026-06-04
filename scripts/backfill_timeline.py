#!/usr/bin/env python3
"""为已处理工单回填 timeline_events（不重新推理、不推企微）。

时间轴仅在 cron 首次 mark_processed 时写入；上线前已处理的工单需本脚本补数。

用法（仓库根，.env 指向生产 Turso / 本地 sqlite）：
  python scripts/backfill_timeline.py
  python scripts/backfill_timeline.py --order-num GD2026060809
  python scripts/backfill_timeline.py --dedupe-key 'STALE_SIGN_PENDING:3243972156617869910'
  python scripts/backfill_timeline.py --all --limit 50
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_PKG = ROOT / "packages" / "aol"
if str(_PKG) not in sys.path:
    sys.path.insert(0, str(_PKG))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("backfill_timeline")


def main() -> int:
    from aol.config import Config
    from aol.tracking.store import TrackingStore

    parser = argparse.ArgumentParser(description="回填 aol_timeline_events")
    parser.add_argument(
        "--all",
        action="store_true",
        help="重写所有已处理工单的时间轴（默认仅补缺失）",
    )
    parser.add_argument("--dedupe-key", help="指定 dedupe_key")
    parser.add_argument("--order-num", help="指定工单号 orderNum")
    parser.add_argument("--limit", type=int, default=0, help="最多处理 N 条")
    args = parser.parse_args()

    limit = args.limit if args.limit > 0 else None

    cfg = Config()
    store = TrackingStore(cfg)
    try:
        stats = store.backfill_timelines(
            cfg,
            missing_only=not args.all,
            dedupe_key=args.dedupe_key,
            order_num=args.order_num,
            limit=limit,
        )
        logger.info(
            "完成：共 %d 条，成功 %d，失败/跳过 %d（tracking=%s）",
            stats["total"],
            stats["ok"],
            stats["fail"],
            cfg.tracking_source,
        )
        return 0 if stats["fail"] == 0 else 1
    finally:
        store.close()


if __name__ == "__main__":
    raise SystemExit(main())
