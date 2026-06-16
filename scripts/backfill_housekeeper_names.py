#!/usr/bin/env python3
"""回填 follow_up_logs.housekeeper_name（Mongo user.name，含非试点管家）。

用法（仓库根）：
  python scripts/backfill_housekeeper_names.py
"""

from __future__ import annotations

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
logger = logging.getLogger("backfill_housekeeper_names")


def main() -> int:
    from aol.config import Config
    from aol.tracking.store import TrackingStore

    cfg = Config.load()
    store = TrackingStore(cfg)
    try:
        stats = store.backfill_housekeeper_names(cfg)
        logger.info("完成：待填 %d，已更新 %d", stats["total"], stats["updated"])
        return 0
    finally:
        store.close()


if __name__ == "__main__":
    raise SystemExit(main())
