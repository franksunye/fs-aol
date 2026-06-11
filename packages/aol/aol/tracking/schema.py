"""追踪库表名与 DDL（本地 sqlite 与云端 Turso 共用一致命名）。

DDL 真源：仓库根 contracts/aol_schema.sql
表名后缀：contracts/tables.json
"""

from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from pathlib import Path


def _repo_root() -> Path:
    # packages/aol/aol/tracking/schema.py → repo root
    return Path(__file__).resolve().parents[4]


@lru_cache(maxsize=1)
def _tables_manifest() -> dict[str, str]:
    path = _repo_root() / "contracts" / "tables.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        "logs": data["logs"],
        "traces": data["traces"],
        "outcomes": data["outcomes"],
        "blockers": data["blockers"],
        "timeline": data["timeline"],
        "actions": data["actions"],
        "engineSnapshots": data["engineSnapshots"],
        "runtimeConfig": data["runtimeConfig"],
        "runtimeConfigRevisions": data["runtimeConfigRevisions"],
    }


TABLE_PREFIX = os.getenv("AOL_TABLE_PREFIX", "aol_")
_SUFFIX = _tables_manifest()
TABLE_LOGS = f"{TABLE_PREFIX}{_SUFFIX['logs']}"
TABLE_TRACES = f"{TABLE_PREFIX}{_SUFFIX['traces']}"
TABLE_OUTCOMES = f"{TABLE_PREFIX}{_SUFFIX['outcomes']}"
TABLE_BLOCKERS = f"{TABLE_PREFIX}{_SUFFIX['blockers']}"
TABLE_TIMELINE = f"{TABLE_PREFIX}{_SUFFIX['timeline']}"
TABLE_ACTIONS = f"{TABLE_PREFIX}{_SUFFIX['actions']}"
TABLE_ENGINE_SNAPSHOTS = f"{TABLE_PREFIX}{_SUFFIX['engineSnapshots']}"
TABLE_RUNTIME_CONFIG = f"{TABLE_PREFIX}{_SUFFIX['runtimeConfig']}"
TABLE_RUNTIME_CONFIG_REVISIONS = f"{TABLE_PREFIX}{_SUFFIX['runtimeConfigRevisions']}"


def _render_schema_sql(prefix: str = TABLE_PREFIX) -> str:
    raw = (_repo_root() / "contracts" / "aol_schema.sql").read_text(encoding="utf-8")
    return raw.replace("{{AOL_TABLE_PREFIX}}", prefix)


def _split_statements(sql: str) -> list[str]:
    parts: list[str] = []
    for chunk in sql.split(";"):
        lines = [
            ln
            for ln in chunk.splitlines()
            if ln.strip() and not ln.strip().startswith("--")
        ]
        stmt = "\n".join(lines).strip()
        if stmt:
            parts.append(stmt + ";")
    return parts


def _statement_for_table(sql: str, table_name: str) -> str:
    for stmt in _split_statements(sql):
        if table_name in stmt:
            return stmt
    raise ValueError(f"DDL for table {table_name!r} not found in contracts/aol_schema.sql")


_rendered = _render_schema_sql()
SCHEMA = _statement_for_table(_rendered, TABLE_LOGS)
SCHEMA_TRACES = _statement_for_table(_rendered, TABLE_TRACES)
SCHEMA_OUTCOMES = _statement_for_table(_rendered, TABLE_OUTCOMES)
SCHEMA_BLOCKERS = _statement_for_table(_rendered, TABLE_BLOCKERS)
SCHEMA_TIMELINE = _statement_for_table(_rendered, TABLE_TIMELINE)
SCHEMA_ACTIONS = _statement_for_table(_rendered, TABLE_ACTIONS)
SCHEMA_ENGINE_SNAPSHOTS = _statement_for_table(_rendered, TABLE_ENGINE_SNAPSHOTS)
SCHEMA_RUNTIME_CONFIG = _statement_for_table(_rendered, TABLE_RUNTIME_CONFIG)
SCHEMA_RUNTIME_CONFIG_REVISIONS = _statement_for_table(_rendered, TABLE_RUNTIME_CONFIG_REVISIONS)

# Index on outcomes (Console ensureSchema also runs this)
_OUTCOMES_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_OUTCOMES)}_dedupe\b",
    re.IGNORECASE,
)
SCHEMA_OUTCOMES_INDEX = next(
    (s for s in _split_statements(_rendered) if _OUTCOMES_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_OUTCOMES}_dedupe ON {TABLE_OUTCOMES}(dedupe_key);",
)
_BLOCKERS_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_BLOCKERS)}_dedupe\b",
    re.IGNORECASE,
)
SCHEMA_BLOCKERS_INDEX = next(
    (s for s in _split_statements(_rendered) if _BLOCKERS_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_BLOCKERS}_dedupe ON {TABLE_BLOCKERS}(dedupe_key);",
)
_TIMELINE_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_TIMELINE)}_wo\b",
    re.IGNORECASE,
)
SCHEMA_TIMELINE_INDEX = next(
    (s for s in _split_statements(_rendered) if _TIMELINE_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_TIMELINE}_wo ON {TABLE_TIMELINE}(work_order_id);",
)
_ACTIONS_DEDUPE_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_ACTIONS)}_dedupe\b",
    re.IGNORECASE,
)
SCHEMA_ACTIONS_DEDUPE_INDEX = next(
    (s for s in _split_statements(_rendered) if _ACTIONS_DEDUPE_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_ACTIONS}_dedupe ON {TABLE_ACTIONS}(dedupe_key);",
)
_ACTIONS_STATUS_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_ACTIONS)}_status\b",
    re.IGNORECASE,
)
SCHEMA_ACTIONS_STATUS_INDEX = next(
    (s for s in _split_statements(_rendered) if _ACTIONS_STATUS_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_ACTIONS}_status ON {TABLE_ACTIONS}(status);",
)
_TRACES_CREATED_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_TRACES)}_created\b",
    re.IGNORECASE,
)
SCHEMA_TRACES_CREATED_INDEX = next(
    (s for s in _split_statements(_rendered) if _TRACES_CREATED_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_TRACES}_created ON {TABLE_TRACES}(created_at);",
)
_ENGINE_SNAPSHOTS_RUN_AT_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_ENGINE_SNAPSHOTS)}_run_at\b",
    re.IGNORECASE,
)
SCHEMA_ENGINE_SNAPSHOTS_RUN_AT_INDEX = next(
    (s for s in _split_statements(_rendered) if _ENGINE_SNAPSHOTS_RUN_AT_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_ENGINE_SNAPSHOTS}_run_at ON {TABLE_ENGINE_SNAPSHOTS}(run_at);",
)
_RUNTIME_CONFIG_REVISIONS_SCOPE_INDEX = re.compile(
    rf"CREATE INDEX IF NOT EXISTS idx_{re.escape(TABLE_RUNTIME_CONFIG_REVISIONS)}_scope\b",
    re.IGNORECASE,
)
SCHEMA_RUNTIME_CONFIG_REVISIONS_SCOPE_INDEX = next(
    (s for s in _split_statements(_rendered) if _RUNTIME_CONFIG_REVISIONS_SCOPE_INDEX.search(s)),
    f"CREATE INDEX IF NOT EXISTS idx_{TABLE_RUNTIME_CONFIG_REVISIONS}_scope "
    f"ON {TABLE_RUNTIME_CONFIG_REVISIONS}(scope, version);",
)
