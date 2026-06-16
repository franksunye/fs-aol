"""统一追踪库接口：local=sqlite，cloud=Turso（幂等水位线 + trace）。"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .. import domain
from ..config import Config
from ..domain import FollowUpSuggestion, WorkOrder, bj_now, work_order_from_sa
from ..context.timeline import build_timeline_events
from ..blocker_types import BLOCKER_LABELS
from .schema import (
    SCHEMA,
    SCHEMA_BLOCKERS,
    SCHEMA_BLOCKERS_INDEX,
    SCHEMA_OUTCOMES,
    SCHEMA_OUTCOMES_INDEX,
    SCHEMA_TIMELINE,
    SCHEMA_TIMELINE_INDEX,
    SCHEMA_ACTIONS,
    SCHEMA_ACTIONS_DEDUPE_INDEX,
    SCHEMA_ACTIONS_STATUS_INDEX,
    SCHEMA_TRACES_CREATED_INDEX,
    SCHEMA_ENGINE_SNAPSHOTS,
    SCHEMA_ENGINE_SNAPSHOTS_RUN_AT_INDEX,
    SCHEMA_RUNTIME_CONFIG,
    SCHEMA_RUNTIME_CONFIG_REVISIONS,
    SCHEMA_RUNTIME_CONFIG_REVISIONS_SCOPE_INDEX,
    SCHEMA_TRACES,
    TABLE_BLOCKERS,
    TABLE_ACTIONS,
    TABLE_ENGINE_SNAPSHOTS,
    TABLE_RUNTIME_CONFIG,
    TABLE_RUNTIME_CONFIG_REVISIONS,
    TABLE_LOGS,
    TABLE_OUTCOMES,
    TABLE_TIMELINE,
    TABLE_TRACES,
)
from .trace import ReasoningTrace

logger = logging.getLogger("aol.tracking")

_DECISION_LABELS = {
    "approved": "已同意",
    "rejected": "已拒绝",
    "modified": "已修改",
    "followed_up": "已跟进",
}


@dataclass
class BlockerFeedback:
    dedupe_key: str
    work_order_id: str
    blocker_type: str
    note: str
    source: str
    operator: str
    created_at: str


@dataclass
class OutcomeRecord:
    dedupe_key: str
    work_order_id: str
    decision: str
    note: str
    operator: str
    created_at: str


class TrackingStore:
    """统一追踪库接口：local=sqlite，cloud=Turso。"""

    @staticmethod
    def _migrate_trace_columns(conn: sqlite3.Connection) -> None:
        trace_cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_TRACES})")}
        if not trace_cols:
            return
        if "event_type" not in trace_cols:
            conn.execute(f"ALTER TABLE {TABLE_TRACES} ADD COLUMN event_type TEXT")
        trace_cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_TRACES})")}
        if "steps_json" not in trace_cols:
            conn.execute(f"ALTER TABLE {TABLE_TRACES} ADD COLUMN steps_json TEXT")

    @staticmethod
    def _migrate_logs_state_at_sqlite(conn: sqlite3.Connection) -> None:
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_LOGS})")}
        if not cols or "state_at" in cols:
            return
        conn.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN state_at TEXT")

    @staticmethod
    def _turso_table_columns(turso: Any, table: str) -> set[str]:
        res = turso.execute(f"PRAGMA table_info({table})")
        if not res.rows:
            return set()
        if hasattr(res, "columns") and res.columns:
            name_idx = res.columns.index("name")
            return {row[name_idx] for row in res.rows}
        return {row[1] for row in res.rows if len(row) > 1}

    @staticmethod
    def _migrate_logs_state_at_turso(turso: Any) -> None:
        cols = TrackingStore._turso_table_columns(turso, TABLE_LOGS)
        if not cols or "state_at" in cols:
            return
        turso.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN state_at TEXT")

    @staticmethod
    def _migrate_logs_inbox_sqlite(conn: sqlite3.Connection) -> None:
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_LOGS})")}
        if not cols:
            return
        for col, typ in (
            ("inbox_bucket", "TEXT"),
            ("archive_reason", "TEXT"),
            ("reconciled_at", "TEXT"),
            ("mongo_status", "TEXT"),
            ("live_verdict", "TEXT"),
        ):
            if col not in cols:
                conn.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN {col} {typ}")

    @staticmethod
    def _migrate_logs_inbox_turso(turso: Any) -> None:
        cols = TrackingStore._turso_table_columns(turso, TABLE_LOGS)
        if not cols:
            return
        for col, typ in (
            ("inbox_bucket", "TEXT"),
            ("archive_reason", "TEXT"),
            ("reconciled_at", "TEXT"),
            ("mongo_status", "TEXT"),
            ("live_verdict", "TEXT"),
        ):
            if col not in cols:
                turso.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN {col} {typ}")

    @staticmethod
    def _migrate_logs_analyzed_stale_sqlite(conn: sqlite3.Connection) -> None:
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_LOGS})")}
        if not cols or "analyzed_stale_days" in cols:
            return
        conn.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN analyzed_stale_days INTEGER")

    @staticmethod
    def _migrate_logs_analyzed_stale_turso(turso: Any) -> None:
        cols = TrackingStore._turso_table_columns(turso, TABLE_LOGS)
        if not cols or "analyzed_stale_days" in cols:
            return
        turso.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN analyzed_stale_days INTEGER")

    @staticmethod
    def _migrate_logs_housekeeper_name_sqlite(conn: sqlite3.Connection) -> None:
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_LOGS})")}
        if not cols or "housekeeper_name" in cols:
            return
        conn.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN housekeeper_name TEXT")

    @staticmethod
    def _migrate_logs_housekeeper_name_turso(turso: Any) -> None:
        cols = TrackingStore._turso_table_columns(turso, TABLE_LOGS)
        if not cols or "housekeeper_name" in cols:
            return
        turso.execute(f"ALTER TABLE {TABLE_LOGS} ADD COLUMN housekeeper_name TEXT")

    @staticmethod
    def _migrate_sqlite_v02(conn: sqlite3.Connection) -> None:
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info({TABLE_LOGS})")}
        if not cols:
            return
        if "dedupe_key" in cols:
            return
        conn.execute(
            f"""
            CREATE TABLE {TABLE_LOGS}_v2 (
                dedupe_key TEXT PRIMARY KEY,
                work_order_id TEXT, event_type TEXT, order_num TEXT, city TEXT,
                housekeeper_id TEXT, suggestion TEXT, status TEXT, processed_at TEXT
            )
            """
        )
        conn.execute(
            f"""
            INSERT INTO {TABLE_LOGS}_v2
            SELECT
                'COMPLETED_CARE:' || work_order_id,
                work_order_id, 'COMPLETED_CARE', order_num, city,
                '', suggestion, status, processed_at
            FROM {TABLE_LOGS}
            """
        )
        conn.execute(f"DROP TABLE {TABLE_LOGS}")
        conn.execute(f"ALTER TABLE {TABLE_LOGS}_v2 RENAME TO {TABLE_LOGS}")

    def _ensure_extended_schema(self) -> None:
        stmts = (
            SCHEMA_OUTCOMES,
            SCHEMA_OUTCOMES_INDEX,
            SCHEMA_BLOCKERS,
            SCHEMA_BLOCKERS_INDEX,
            SCHEMA_TIMELINE,
            SCHEMA_TIMELINE_INDEX,
            SCHEMA_ACTIONS,
            SCHEMA_ACTIONS_DEDUPE_INDEX,
            SCHEMA_ACTIONS_STATUS_INDEX,
            SCHEMA_TRACES_CREATED_INDEX,
            SCHEMA_ENGINE_SNAPSHOTS,
            SCHEMA_ENGINE_SNAPSHOTS_RUN_AT_INDEX,
            SCHEMA_RUNTIME_CONFIG,
            SCHEMA_RUNTIME_CONFIG_REVISIONS,
            SCHEMA_RUNTIME_CONFIG_REVISIONS_SCOPE_INDEX,
        )
        if self._conn is not None:
            for stmt in stmts:
                self._conn.execute(stmt)
            self._conn.commit()
        else:
            for stmt in stmts:
                self._turso.execute(stmt)

    def __init__(self, cfg: Config):
        self.cfg = cfg
        if cfg.tracking_source == "local":
            db_path = os.path.abspath(cfg.tracking_local_path)
            os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
            self._conn = sqlite3.connect(db_path)
            self._conn.row_factory = sqlite3.Row
            self._conn.execute(SCHEMA)
            self._migrate_sqlite_v02(self._conn)
            self._migrate_logs_state_at_sqlite(self._conn)
            self._migrate_logs_inbox_sqlite(self._conn)
            self._migrate_logs_analyzed_stale_sqlite(self._conn)
            self._migrate_logs_housekeeper_name_sqlite(self._conn)
            self._conn.execute(SCHEMA_TRACES)
            self._migrate_trace_columns(self._conn)
            self._ensure_extended_schema()
            self._conn.commit()
            self._turso = None
            logger.info("追踪库 sqlite: %s", db_path)
        elif cfg.tracking_source == "cloud":
            from libsql_client import create_client_sync  # 懒加载

            turso_url = cfg.turso_url
            if turso_url.startswith("libsql://"):
                turso_url = "https://" + turso_url[len("libsql://"):]
            self._conn = None
            self._turso = create_client_sync(url=turso_url, auth_token=cfg.turso_token)
            self._turso.execute(SCHEMA)
            self._migrate_logs_state_at_turso(self._turso)
            self._migrate_logs_inbox_turso(self._turso)
            self._migrate_logs_analyzed_stale_turso(self._turso)
            self._migrate_logs_housekeeper_name_turso(self._turso)
            self._turso.execute(SCHEMA_TRACES)
            self._ensure_extended_schema()
        else:
            raise ValueError(f"未知 TRACKING_SOURCE: {cfg.tracking_source}")

    def _row_to_dict(self, row: Any) -> Dict[str, Any]:
        if isinstance(row, sqlite3.Row):
            return {k: row[k] for k in row.keys()}
        if isinstance(row, dict):
            return row
        if hasattr(row, "_asdict"):
            return row._asdict()
        # libsql tuple rows with column names from execute
        return dict(row) if isinstance(row, dict) else {}

    def _fetchone_dict(self, sql: str, args: tuple = ()) -> Optional[Dict[str, Any]]:
        if self._conn is not None:
            cur = self._conn.execute(sql, args)
            row = cur.fetchone()
            if row is None:
                return None
            return {k: row[k] for k in row.keys()}
        res = self._turso.execute(sql, list(args))
        if not res.rows:
            return None
        row = res.rows[0]
        if hasattr(res, "columns") and res.columns:
            return {res.columns[i]: row[i] for i in range(len(row))}
        if isinstance(row, dict):
            return row
        return {"dedupe_key": row[0]} if row else None

    def _fetchall_dicts(self, sql: str, args: tuple = ()) -> list[Dict[str, Any]]:
        if self._conn is not None:
            cur = self._conn.execute(sql, args)
            return [{k: r[k] for k in r.keys()} for r in cur.fetchall()]
        res = self._turso.execute(sql, list(args))
        if not res.rows:
            return []
        if hasattr(res, "columns") and res.columns:
            return [
                {res.columns[i]: row[i] for i in range(len(row))}
                for row in res.rows
            ]
        return [dict(r) if isinstance(r, dict) else {} for r in res.rows]

    def get_processed_dedupe_keys(self) -> set[str]:
        rows = self._fetchall_dicts(f"SELECT dedupe_key FROM {TABLE_LOGS}")
        return {str(r["dedupe_key"]) for r in rows if r.get("dedupe_key")}

    def get_reprocessable_dedupe_keys(self) -> set[str]:
        """最新 outcome 为 followed_up 的 dedupe_key，允许再次入池。"""
        sql = f"""
            SELECT o.dedupe_key FROM {TABLE_OUTCOMES} o
            JOIN (
                SELECT dedupe_key, MAX(id) AS mid FROM {TABLE_OUTCOMES} GROUP BY dedupe_key
            ) m ON o.id = m.mid
            WHERE o.decision = 'followed_up'
        """
        rows = self._fetchall_dicts(sql)
        return {str(r["dedupe_key"]) for r in rows if r.get("dedupe_key")}

    def get_time_reprocessable_dedupe_keys(self) -> set[str]:
        from ..reprocess.time_trigger import select_time_reprocess_keys

        return select_time_reprocess_keys(self.cfg, self)

    def get_follow_up_log(self, dedupe_key: str) -> Optional[Dict[str, Any]]:
        return self._fetchone_dict(
            f"SELECT * FROM {TABLE_LOGS} WHERE dedupe_key = ? LIMIT 1",
            (dedupe_key,),
        )

    def get_fact_drift_reprocessable_dedupe_keys(self) -> set[str]:
        from ..reprocess.fact_drift import select_fact_drift_reprocess_keys

        return select_fact_drift_reprocess_keys(self.cfg, self)

    def effective_processed_keys(self) -> set[str]:
        reopen = (
            self.get_reprocessable_dedupe_keys()
            | self.get_time_reprocessable_dedupe_keys()
            | self.get_fact_drift_reprocessable_dedupe_keys()
        )
        return self.get_processed_dedupe_keys() - reopen

    def get_latest_blocker(self, dedupe_key: str) -> Optional[BlockerFeedback]:
        row = self._fetchone_dict(
            f"""
            SELECT * FROM {TABLE_BLOCKERS}
            WHERE dedupe_key = ?
            ORDER BY id DESC LIMIT 1
            """,
            (dedupe_key,),
        )
        if not row:
            return None
        return BlockerFeedback(
            dedupe_key=str(row.get("dedupe_key", "")),
            work_order_id=str(row.get("work_order_id", "")),
            blocker_type=str(row.get("blocker_type", "UNKNOWN")),
            note=str(row.get("note") or ""),
            source=str(row.get("source") or "housekeeper_selected"),
            operator=str(row.get("operator") or ""),
            created_at=str(row.get("created_at") or ""),
        )

    def save_blocker(
        self,
        *,
        dedupe_key: str,
        work_order_id: str,
        blocker_type: str,
        note: str = "",
        source: str = "housekeeper_selected",
        operator: str = "console",
    ) -> None:
        now = bj_now().isoformat()
        row = (
            dedupe_key,
            work_order_id,
            blocker_type,
            note,
            source,
            operator,
            now,
        )
        sql = (
            f"INSERT INTO {TABLE_BLOCKERS} "
            "(dedupe_key, work_order_id, blocker_type, note, source, operator, created_at) "
            "VALUES (?,?,?,?,?,?,?)"
        )
        if self._conn is not None:
            self._conn.execute(sql, row)
            self._conn.commit()
        else:
            self._turso.execute(sql, list(row))

    def get_latest_outcome(self, dedupe_key: str) -> Optional[OutcomeRecord]:
        row = self._fetchone_dict(
            f"""
            SELECT * FROM {TABLE_OUTCOMES}
            WHERE dedupe_key = ?
            ORDER BY id DESC LIMIT 1
            """,
            (dedupe_key,),
        )
        if not row:
            return None
        return OutcomeRecord(
            dedupe_key=str(row.get("dedupe_key", "")),
            work_order_id=str(row.get("work_order_id", "")),
            decision=str(row.get("decision", "")),
            note=str(row.get("note") or ""),
            operator=str(row.get("operator") or ""),
            created_at=str(row.get("created_at") or ""),
        )

    def build_prior_context(self, dedupe_key: str) -> str:
        """拼装上一轮反馈/卡点（只读），供推理 prompt 使用。"""
        lines: list[str] = []
        outcome = self.get_latest_outcome(dedupe_key)
        if outcome and outcome.decision:
            label = _DECISION_LABELS.get(outcome.decision, outcome.decision)
            line = f"- 反馈：{label}"
            if outcome.note:
                line += f"（{outcome.note}）"
            lines.append(line)
        blocker = self.get_latest_blocker(dedupe_key)
        if blocker and blocker.blocker_type != "UNKNOWN":
            label = BLOCKER_LABELS.get(blocker.blocker_type, blocker.blocker_type)
            line = f"- 卡点：{label}"
            if blocker.note:
                line += f" — 「{blocker.note}」"
            lines.append(line)
        if not lines:
            return ""
        return "## 上一轮反馈（只读）\n" + "\n".join(lines)

    def list_follow_up_logs(
        self,
        *,
        missing_timeline_only: bool = False,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """已处理工单（follow_up_logs）；可选仅缺时间轴的行。"""
        if missing_timeline_only:
            sql = f"""
                SELECT l.* FROM {TABLE_LOGS} l
                WHERE NOT EXISTS (
                    SELECT 1 FROM {TABLE_TIMELINE} t
                    WHERE t.work_order_id = l.work_order_id
                )
                ORDER BY l.processed_at DESC
            """
        else:
            sql = f"SELECT * FROM {TABLE_LOGS} ORDER BY processed_at DESC"
        rows = self._fetchall_dicts(sql)
        if limit is not None and limit > 0:
            rows = rows[:limit]
        return rows

    def _row_to_reasoning_trace(self, row: Dict[str, Any]) -> ReasoningTrace:
        parsed_raw = row.get("parsed")
        parsed: Optional[Dict[str, Any]] = None
        if parsed_raw:
            try:
                parsed = json.loads(parsed_raw) if isinstance(parsed_raw, str) else parsed_raw
            except json.JSONDecodeError:
                parsed = None
        return ReasoningTrace(
            work_order_id=str(row.get("work_order_id") or ""),
            mode=str(row.get("mode") or "unknown"),
            event_type=str(row.get("event_type") or ""),
            model=str(row.get("model") or ""),
            prompt_system=str(row.get("prompt_system") or ""),
            prompt_user=str(row.get("prompt_user") or ""),
            raw_response=str(row.get("raw_response") or ""),
            parsed=parsed,
            prompt_tokens=int(row.get("prompt_tokens") or 0),
            completion_tokens=int(row.get("completion_tokens") or 0),
            total_tokens=int(row.get("total_tokens") or 0),
            latency_ms=int(row.get("latency_ms") or 0),
            status=str(row.get("status") or "ok"),
            error=str(row.get("error") or ""),
            steps_json=str(row.get("steps_json") or ""),
            created_at=str(row.get("created_at") or ""),
        )

    def get_latest_trace(self, work_order_id: str) -> Optional[ReasoningTrace]:
        row = self._fetchone_dict(
            f"""
            SELECT * FROM {TABLE_TRACES}
            WHERE work_order_id = ?
            ORDER BY id DESC LIMIT 1
            """,
            (work_order_id,),
        )
        if not row:
            return None
        trace = self._row_to_reasoning_trace(row)
        trace.latency_ms = int(row.get("latency_ms") or 0)
        return trace

    def list_traces_for_work_order(
        self, work_order_id: str, *, limit: int = 30
    ) -> List[ReasoningTrace]:
        """按时间正序返回推理 trace（用于时间轴展示再分析历史）。"""
        rows = self._fetchall_dicts(
            f"""
            SELECT * FROM {TABLE_TRACES}
            WHERE work_order_id = ?
            ORDER BY id ASC
            LIMIT ?
            """,
            (work_order_id, max(1, limit)),
        )
        out: List[ReasoningTrace] = []
        for row in rows:
            trace = self._row_to_reasoning_trace(row)
            trace.latency_ms = int(row.get("latency_ms") or 0)
            out.append(trace)
        return out

    def _work_order_for_backfill(
        self, cfg: Config, log: Dict[str, Any]
    ) -> WorkOrder:
        """回填用：优先 Mongo 工单事实（经 subject_resolve），否则用 logs 行拼最小 WorkOrder。"""
        wid = str(log.get("work_order_id") or "")
        event_type = str(log.get("event_type") or "")
        state_at = str(log.get("state_at") or "").strip()

        if cfg.fsm_source == "mongo" and cfg.fsm_mongo_url and wid:
            try:
                from ..integration.subject_resolve import load_work_order

                wo = load_work_order(cfg, work_order_id=wid)
                if wo is not None:
                    wo.event_type = event_type or wo.event_type
                    if state_at:
                        wo.completed_at = state_at
                    return wo
            except Exception:
                logger.warning("回填拉 Mongo 工单 %s 失败，改用 logs 快照。", wid)

        return WorkOrder(
            work_order_id=wid,
            order_num=str(log.get("order_num") or ""),
            city=str(log.get("city") or ""),
            housekeeper_id=str(log.get("housekeeper_id") or ""),
            completed_at=state_at,
            event_type=event_type,
        )

    def refresh_timeline_for_log(self, cfg: Config, log: Dict[str, Any]) -> bool:
        """用 Mongo 最新事实 + logs/trace/outcomes 重物化时间轴（不跑 LLM）。"""
        dedupe_key = str(log.get("dedupe_key") or "")
        wid = str(log.get("work_order_id") or "")
        if not dedupe_key or not wid:
            return False

        raw_suggestion = log.get("suggestion")
        if not raw_suggestion:
            return False
        try:
            suggestion = FollowUpSuggestion.from_dict(
                json.loads(raw_suggestion)
                if isinstance(raw_suggestion, str)
                else raw_suggestion
            )
        except (json.JSONDecodeError, TypeError, ValueError):
            logger.warning("工单 %s suggestion JSON 无效，跳过时间轴刷新。", wid)
            return False

        trace = self.get_latest_trace(wid)
        if trace is None:
            trace = ReasoningTrace(
                work_order_id=wid,
                mode="backfill",
                event_type=str(log.get("event_type") or ""),
                created_at=str(log.get("processed_at") or bj_now().isoformat()),
            )

        wo = self._work_order_for_backfill(cfg, log)
        self.refresh_timeline(cfg, wo, suggestion, trace, log_row=log)
        return True

    def backfill_timeline_for_log(self, cfg: Config, log: Dict[str, Any]) -> bool:
        """兼容旧名：等同 refresh_timeline_for_log。"""
        return self.refresh_timeline_for_log(cfg, log)

    def backfill_timelines(
        self,
        cfg: Config,
        *,
        missing_only: bool = True,
        dedupe_key: Optional[str] = None,
        order_num: Optional[str] = None,
        work_order_id: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, int]:
        """批量回填时间轴。默认仅处理尚无 timeline_events 的工单。"""
        from ..integration.subject_resolve import filter_follow_up_logs, subject_ref

        scope = dedupe_key or work_order_id or order_num or ""
        logs = self.list_follow_up_logs(
            missing_timeline_only=missing_only and not scope,
            limit=None,
        )
        logs = filter_follow_up_logs(
            logs,
            dedupe_key=str(dedupe_key or ""),
            work_order_id=str(work_order_id or ""),
            order_num=str(order_num or ""),
        )
        if limit is not None and limit > 0:
            logs = logs[:limit]

        stats = {"total": len(logs), "ok": 0, "fail": 0}
        for log in logs:
            ref = subject_ref(log)
            try:
                if self.backfill_timeline_for_log(cfg, log):
                    stats["ok"] += 1
                    logger.info("时间轴已回填: %s", ref)
                else:
                    stats["fail"] += 1
                    logger.warning("时间轴回填跳过: %s", ref)
            except Exception:
                stats["fail"] += 1
                logger.exception("时间轴回填失败: %s", ref)
        return stats

    def backfill_housekeeper_names(self, cfg: Config) -> Dict[str, int]:
        """从 Mongo user 表回填 follow_up_logs.housekeeper_name（展示用）。"""
        if cfg.fsm_source != "mongo" or not cfg.fsm_mongo_url:
            return {"total": 0, "updated": 0, "skipped": 0}

        from pymongo import MongoClient

        logs = self.list_follow_up_logs(limit=None)
        need = [
            r
            for r in logs
            if str(r.get("housekeeper_id") or "").strip()
            and not str(r.get("housekeeper_name") or "").strip()
        ]
        if not need:
            return {"total": 0, "updated": 0, "skipped": len(logs)}

        ids = list({str(r.get("housekeeper_id")) for r in need})
        client = MongoClient(cfg.fsm_mongo_url, serverSelectionTimeoutMS=8000)
        try:
            db = client[cfg.fsm_mongo_db]
            name_map: Dict[str, str] = {}
            for doc in db["user"].find({"_id": {"$in": ids}}, {"_id": 1, "name": 1}):
                name_map[str(doc["_id"])] = str(doc.get("name") or "").strip()
        finally:
            client.close()

        updated = 0
        for log in need:
            hid = str(log.get("housekeeper_id") or "")
            name = name_map.get(hid, "")
            if not name:
                continue
            dk = str(log.get("dedupe_key") or "")
            sql = f"UPDATE {TABLE_LOGS} SET housekeeper_name = ? WHERE dedupe_key = ?"
            if self._conn is not None:
                self._conn.execute(sql, (name, dk))
            else:
                self._turso.execute(sql, [name, dk])
            updated += 1
        if self._conn is not None:
            self._conn.commit()
        return {"total": len(need), "updated": updated, "skipped": len(need) - updated}

    def refresh_timeline(
        self,
        cfg: Config,
        wo: WorkOrder,
        suggestion: FollowUpSuggestion,
        trace: ReasoningTrace,
        *,
        log_row: Optional[Dict[str, Any]] = None,
    ) -> None:
        """跑单或同步后物化时间轴（纯 A：Console 只读此表）。"""
        events = build_timeline_events(
            cfg, wo, suggestion, trace, self, log_row=log_row
        )
        if self._conn is not None:
            self._conn.execute(
                f"DELETE FROM {TABLE_TIMELINE} WHERE work_order_id = ?",
                (wo.work_order_id,),
            )
            sql = (
                f"INSERT INTO {TABLE_TIMELINE} "
                "(work_order_id, dedupe_key, lane, kind, at, at_ms, title, summary, ref_id, payload_json) "
                "VALUES (?,?,?,?,?,?,?,?,?,?)"
            )
            for ev in events:
                self._conn.execute(
                    sql,
                    (
                        ev["work_order_id"],
                        ev["dedupe_key"],
                        ev["lane"],
                        ev["kind"],
                        ev["at"],
                        ev["at_ms"],
                        ev["title"],
                        ev["summary"] or "",
                        ev["ref_id"] or "",
                        ev["payload_json"],
                    ),
                )
            self._conn.commit()
        else:
            self._turso.execute(
                f"DELETE FROM {TABLE_TIMELINE} WHERE work_order_id = ?",
                [wo.work_order_id],
            )
            sql = (
                f"INSERT INTO {TABLE_TIMELINE} "
                "(work_order_id, dedupe_key, lane, kind, at, at_ms, title, summary, ref_id, payload_json) "
                "VALUES (?,?,?,?,?,?,?,?,?,?)"
            )
            for ev in events:
                self._turso.execute(
                    sql,
                    [
                        ev["work_order_id"],
                        ev["dedupe_key"],
                        ev["lane"],
                        ev["kind"],
                        ev["at"],
                        ev["at_ms"],
                        ev["title"],
                        ev["summary"] or "",
                        ev["ref_id"] or "",
                        ev["payload_json"],
                    ],
                )

    def list_logs_for_inbox_sync(
        self,
        *,
        only_active: bool = True,
        limit: Optional[int] = None,
        order_num: Optional[str] = None,
        work_order_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        clauses: List[str] = []
        args: List[Any] = []
        if work_order_id:
            clauses.append("work_order_id = ?")
            args.append(work_order_id)
        elif order_num:
            clauses.append("order_num = ?")
            args.append(order_num)
        elif only_active:
            clauses.append("(inbox_bucket IS NULL OR inbox_bucket = 'active')")
        sql = f"SELECT * FROM {TABLE_LOGS}"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY processed_at DESC"
        rows = self._fetchall_dicts(sql, tuple(args))
        if limit is not None and limit > 0:
            rows = rows[:limit]
        return rows

    def get_outcomes_for_dedupe_keys(
        self, dedupe_keys: List[str]
    ) -> Dict[str, OutcomeRecord]:
        if not dedupe_keys:
            return {}
        ph = ",".join("?" * len(dedupe_keys))
        sql = f"""
            SELECT o.* FROM {TABLE_OUTCOMES} o
            INNER JOIN (
                SELECT dedupe_key, MAX(id) AS mid FROM {TABLE_OUTCOMES}
                WHERE dedupe_key IN ({ph}) GROUP BY dedupe_key
            ) m ON o.id = m.mid
        """
        out: Dict[str, OutcomeRecord] = {}
        for row in self._fetchall_dicts(sql, tuple(dedupe_keys)):
            dk = str(row.get("dedupe_key") or "")
            if not dk:
                continue
            out[dk] = OutcomeRecord(
                dedupe_key=dk,
                work_order_id=str(row.get("work_order_id") or ""),
                decision=str(row.get("decision") or ""),
                note=str(row.get("note") or ""),
                operator=str(row.get("operator") or ""),
                created_at=str(row.get("created_at") or ""),
            )
        return out

    def get_actions_for_dedupe_keys(
        self, dedupe_keys: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        if not dedupe_keys:
            return {}
        ph = ",".join("?" * len(dedupe_keys))
        sql = f"""
            SELECT a.* FROM {TABLE_ACTIONS} a
            INNER JOIN (
                SELECT dedupe_key, MAX(id) AS mid FROM {TABLE_ACTIONS}
                WHERE dedupe_key IN ({ph}) GROUP BY dedupe_key
            ) m ON a.id = m.mid
        """
        out: Dict[str, Dict[str, Any]] = {}
        for row in self._fetchall_dicts(sql, tuple(dedupe_keys)):
            dk = str(row.get("dedupe_key") or "")
            if dk:
                out[dk] = row
        return out

    def update_inbox_state(
        self,
        dedupe_key: str,
        *,
        bucket: str,
        archive_reason: str = "",
        mongo_status: str = "",
        live_verdict: str = "",
    ) -> None:
        now = bj_now().isoformat()
        args = (
            bucket,
            archive_reason or "",
            now,
            mongo_status or "",
            live_verdict or "",
            dedupe_key,
        )
        sql = (
            f"UPDATE {TABLE_LOGS} SET inbox_bucket = ?, archive_reason = ?, "
            "reconciled_at = ?, mongo_status = ?, live_verdict = ? WHERE dedupe_key = ?"
        )
        if self._conn is not None:
            self._conn.execute(sql, args)
            self._conn.commit()
        else:
            self._turso.execute(sql, list(args))

    def mark_processed(self, wo: WorkOrder, suggestion: FollowUpSuggestion, status: str) -> None:
        from ..inbox.sync import initial_inbox_state

        now = bj_now().isoformat()
        payload = json.dumps(suggestion.to_dict(), ensure_ascii=False)
        state_at = (wo.completed_at or "").strip() or None
        init = initial_inbox_state(suggestion)
        analyzed_stale = max(0, int(wo.stale_days or 0))
        hk_name = (wo.housekeeper_name or "").strip()
        row = (
            wo.dedupe_key, wo.work_order_id, wo.event_type, wo.order_num, wo.city,
            wo.housekeeper_id, hk_name, payload, status, now, state_at,
            init.bucket, init.reason or "", now, "", "",
            analyzed_stale,
        )
        sql = (
            f"INSERT OR REPLACE INTO {TABLE_LOGS} "
            "(dedupe_key, work_order_id, event_type, order_num, city, housekeeper_id, "
            "housekeeper_name, suggestion, status, processed_at, state_at, inbox_bucket, "
            "archive_reason, reconciled_at, mongo_status, live_verdict, analyzed_stale_days) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        )
        if self._conn is not None:
            self._conn.execute(sql, row)
            self._conn.commit()
        else:
            self._turso.execute(sql, list(row))

    def log_reasoning_trace(self, t: ReasoningTrace) -> None:
        parsed = json.dumps(t.parsed, ensure_ascii=False) if t.parsed is not None else None
        row = (
            t.work_order_id, t.event_type, t.mode, t.model, t.prompt_system, t.prompt_user,
            t.raw_response, parsed, t.prompt_tokens, t.completion_tokens,
            t.total_tokens, t.latency_ms, t.status, t.error, t.steps_json or None, t.created_at,
        )
        sql = (
            f"INSERT INTO {TABLE_TRACES} "
            "(work_order_id, event_type, mode, model, prompt_system, prompt_user, raw_response, parsed, "
            "prompt_tokens, completion_tokens, total_tokens, latency_ms, status, error, steps_json, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        )
        if self._conn is not None:
            self._conn.execute(sql, row)
            self._conn.commit()
        else:
            self._turso.execute(sql, list(row))

    def get_active_runtime_config(self, scope: str = "follow_up") -> Optional[Dict[str, Any]]:
        """读取 Console 写入的 active runtime config（含加密 secrets 列）。"""
        sql = (
            f"SELECT scope, config_json, secrets_ciphertext, secrets_nonce, "
            f"version, updated_at, updated_by FROM {TABLE_RUNTIME_CONFIG} WHERE scope = ?"
        )
        if self._conn is not None:
            row = self._conn.execute(sql, (scope,)).fetchone()
        else:
            res = self._turso.execute(sql, [scope])
            row = res.rows[0] if res.rows else None
        if not row:
            return None
        if hasattr(row, "keys"):
            return dict(row)
        return {
            "scope": row[0],
            "config_json": row[1],
            "secrets_ciphertext": row[2],
            "secrets_nonce": row[3],
            "version": row[4],
            "updated_at": row[5],
            "updated_by": row[6] if len(row) > 6 else None,
        }

    def upsert_runtime_config(
        self,
        scope: str,
        config_json: str,
        secrets_ciphertext: str,
        secrets_nonce: str,
        version: int,
        updated_at: str,
        updated_by: str,
        change_summary: str = "",
    ) -> None:
        sql = (
            f"INSERT INTO {TABLE_RUNTIME_CONFIG} "
            "(scope, config_json, secrets_ciphertext, secrets_nonce, version, updated_at, updated_by) "
            "VALUES (?,?,?,?,?,?,?) "
            "ON CONFLICT(scope) DO UPDATE SET "
            "config_json=excluded.config_json, "
            "secrets_ciphertext=excluded.secrets_ciphertext, "
            "secrets_nonce=excluded.secrets_nonce, "
            "version=excluded.version, "
            "updated_at=excluded.updated_at, "
            "updated_by=excluded.updated_by"
        )
        args = (
            scope,
            config_json,
            secrets_ciphertext,
            secrets_nonce,
            version,
            updated_at,
            updated_by,
        )
        rev_sql = (
            f"INSERT INTO {TABLE_RUNTIME_CONFIG_REVISIONS} "
            "(scope, version, config_json, secrets_ciphertext, secrets_nonce, "
            "change_summary, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?)"
        )
        rev_args = (
            scope,
            version,
            config_json,
            secrets_ciphertext,
            secrets_nonce,
            change_summary,
            updated_at,
            updated_by,
        )
        if self._conn is not None:
            self._conn.execute(sql, args)
            self._conn.execute(rev_sql, rev_args)
            self._conn.commit()
        else:
            self._turso.execute(sql, list(args))
            self._turso.execute(rev_sql, list(rev_args))

    def save_engine_runtime_snapshot(
        self, snapshot: Dict[str, Any], run_summary: Optional[Dict[str, Any]] = None
    ) -> None:
        """写入脱敏引擎配置快照（每轮 cron 一次）。"""
        run_at = (run_summary or {}).get("run_at") or bj_now()
        snapshot_json = json.dumps(snapshot, ensure_ascii=False)
        run_summary_json = (
            json.dumps(run_summary, ensure_ascii=False) if run_summary else None
        )
        sql = (
            f"INSERT INTO {TABLE_ENGINE_SNAPSHOTS} "
            "(run_at, snapshot_json, run_summary_json) VALUES (?,?,?)"
        )
        args = (run_at, snapshot_json, run_summary_json)
        if self._conn is not None:
            self._conn.execute(sql, args)
            self._conn.commit()
        else:
            self._turso.execute(sql, list(args))

    def clear_all_data(self) -> int:
        """清空水位线与 trace 表数据，保留 db 文件（E2E 可重复 + GUI 可刷新）。"""
        if self._conn is None:
            raise RuntimeError("clear_all_data 仅支持 TRACKING_SOURCE=local")
        total = 0
        for table in (TABLE_LOGS, TABLE_TRACES, TABLE_OUTCOMES, TABLE_BLOCKERS, TABLE_TIMELINE):
            cur = self._conn.execute(f"DELETE FROM {table}")
            total += cur.rowcount
        self._conn.execute(
            "DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?, ?)",
            (TABLE_TRACES, TABLE_OUTCOMES, TABLE_BLOCKERS, TABLE_TIMELINE),
        )
        self._conn.commit()
        return total

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
        elif self._turso is not None:
            self._turso.close()
