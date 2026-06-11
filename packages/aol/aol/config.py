"""运行配置（环境变量 → Config）。"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .util import env_bool


@dataclass
class Config:
    # 开发环境 E2E 默认 true：企微仅预览、不打扰群；真发需显式 DRY_RUN=false
    dry_run: bool = field(default_factory=lambda: env_bool("DRY_RUN", True))

    # 工单数据源（v0.2 起默认 dev 真实库，mock 仅用于离线 CI）
    fsm_source: str = field(default_factory=lambda: os.getenv("FSM_SOURCE", "mongo").lower())
    fsm_mongo_url: str = field(default_factory=lambda: os.getenv("FSM_MONGO_URL", ""))
    fsm_mongo_db: str = field(default_factory=lambda: os.getenv("FSM_MONGO_DB", "xlinkdemo"))
    fsm_time_field: str = field(default_factory=lambda: os.getenv("FSM_TIME_FIELD", "updateTime"))
    lookback_hours: int = field(default_factory=lambda: int(os.getenv("FSM_LOOKBACK_HOURS", "24")))
    fsm_batch_limit: int = field(default_factory=lambda: int(os.getenv("FSM_BATCH_LIMIT", "50")))
    # 仅跟进 updateTime 在最近 N 天内（默认 14）；超过认为无意义
    fsm_max_age_days: int = field(default_factory=lambda: int(os.getenv("FSM_MAX_AGE_DAYS", "14")))
    fsm_stale_days: int = field(default_factory=lambda: int(os.getenv("FSM_STALE_DAYS", "0")))
    fsm_event_statuses: str = field(default_factory=lambda: os.getenv("FSM_EVENT_STATUSES", ""))
    # v0.2 试点：逗号分隔姓名（mongo 解析）或 userId；空=不过滤
    pilot_housekeepers: str = field(default_factory=lambda: os.getenv("FSM_PILOT_HOUSEKEEPERS", ""))
    pilot_housekeeper_ids: str = field(
        default_factory=lambda: os.getenv("FSM_PILOT_HOUSEKEEPER_IDS", "")
    )
    wecom_webhook_map: str = field(default_factory=lambda: os.getenv("WECOM_WEBHOOK_MAP", ""))
    # 运行期解析结果（run 启动时填充）
    resolved_pilot_ids: Optional[List[str]] = field(default=None, repr=False)
    pilot_id_to_name: Dict[str, str] = field(default_factory=dict, repr=False)

    # 追踪库（幂等水位线）
    tracking_source: str = field(
        default_factory=lambda: os.getenv("TRACKING_SOURCE", "local").lower()
    )
    tracking_local_path: str = field(
        default_factory=lambda: os.getenv("TRACKING_LOCAL_PATH", "data/agent_loop_tracking.db")
    )
    turso_url: str = field(default_factory=lambda: os.getenv("TURSO_URL", ""))
    turso_token: str = field(default_factory=lambda: os.getenv("TURSO_TOKEN", ""))

    # 推理提供方：heuristic（不走 API）| hunyuan（默认免费）| deepseek（质量验证）
    llm_provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "hunyuan").lower()
    )
    llm_api_key: str = field(default_factory=lambda: os.getenv("LLM_API_KEY", ""))
    llm_base_url: str = field(default_factory=lambda: os.getenv("LLM_BASE_URL", ""))
    llm_model: str = field(default_factory=lambda: os.getenv("LLM_MODEL", ""))
    hunyuan_api_key: str = field(default_factory=lambda: os.getenv("HUNYUAN_API_KEY", ""))

    # 推理模式：oneshot（默认试点）| steps（展示轨：enrich + LLM，见 docs/10）
    agent_mode: str = field(
        default_factory=lambda: os.getenv("AGENT_MODE", "oneshot").lower()
    )

    # 输出：群机器人 webhook + 可选企业应用消息（可信 IP 环境）
    wecom_webhook: str = field(default_factory=lambda: os.getenv("WECOM_WEBHOOK", ""))
    wecom_corp_id: str = field(default_factory=lambda: os.getenv("WECOM_CORP_ID", ""))
    wecom_agent_id: str = field(default_factory=lambda: os.getenv("WECOM_AGENT_ID", ""))
    wecom_agent_secret: str = field(default_factory=lambda: os.getenv("WECOM_AGENT_SECRET", ""))
    console_base_url: str = field(
        default_factory=lambda: os.getenv("CONSOLE_BASE_URL", "").rstrip("/")
    )

    # 时间触发再分析（停滞类事件：滞留变长 / 距上次推理过久则重新入池）
    reanalyze_enabled: bool = field(
        default_factory=lambda: env_bool("REANALYZE_ENABLED", True)
    )
    reanalyze_interval_days: int = field(
        default_factory=lambda: int(os.getenv("REANALYZE_INTERVAL_DAYS", "3"))
    )
    reanalyze_stale_step_days: int = field(
        default_factory=lambda: int(os.getenv("REANALYZE_STALE_STEP_DAYS", "7"))
    )
    reanalyze_max_per_run: int = field(
        default_factory=lambda: int(os.getenv("REANALYZE_MAX_PER_RUN", "10"))
    )
    reanalyze_push: bool = field(
        default_factory=lambda: env_bool("REANALYZE_PUSH", True)
    )
    reanalyze_push_on_same_priority: bool = field(
        default_factory=lambda: env_bool("REANALYZE_PUSH_ON_SAME_PRIORITY", False)
    )

    def public_snapshot(self) -> Dict[str, Any]:
        """脱敏运行时配置，供 Turso 快照与 Console 只读镜像（不含 secret/URL）。"""
        _, _, _, model, _ = self.resolved_llm()
        pilots: List[Dict[str, str]] = []
        if self.resolved_pilot_ids:
            for pid in self.resolved_pilot_ids:
                pilots.append(
                    {
                        "id": pid,
                        "name": self.pilot_id_to_name.get(pid, pid),
                    }
                )
        elif self.pilot_housekeeper_ids.strip():
            for pid in self.pilot_housekeeper_ids.split(","):
                p = pid.strip()
                if p:
                    pilots.append({"id": p, "name": p})
        elif self.pilot_housekeepers.strip():
            for name in self.pilot_housekeepers.split(","):
                n = name.strip()
                if n:
                    pilots.append({"id": "", "name": n})

        wecom_webhook_map_count = 0
        if self.wecom_webhook_map.strip():
            wecom_webhook_map_count = len(
                [x for x in self.wecom_webhook_map.split(",") if x.strip()]
            )

        return {
            "dry_run": self.dry_run,
            "fsm_source": self.fsm_source,
            "fsm_mongo_configured": bool(self.fsm_mongo_url.strip()),
            "fsm_mongo_db": self.fsm_mongo_db if self.fsm_mongo_url.strip() else "",
            "fsm_event_statuses": [
                s.strip()
                for s in (self.fsm_event_statuses or "206").split(",")
                if s.strip()
            ],
            "fsm_max_age_days": self.fsm_max_age_days,
            "fsm_stale_days": self.fsm_stale_days,
            "fsm_batch_limit": self.fsm_batch_limit,
            "fsm_lookback_hours": self.lookback_hours,
            "pilots": pilots,
            "llm_provider": self.llm_provider,
            "llm_model": model,
            "agent_mode": self.agent_mode,
            "tracking_source": self.tracking_source,
            "console_base_url": self.console_base_url,
            "wecom_configured": bool(
                self.wecom_webhook.strip()
                or self.wecom_webhook_map.strip()
                or (
                    self.wecom_corp_id.strip()
                    and self.wecom_agent_id.strip()
                    and self.wecom_agent_secret.strip()
                )
            ),
            "wecom_webhook_map_count": wecom_webhook_map_count,
            "reanalyze_enabled": self.reanalyze_enabled,
            "reanalyze_interval_days": self.reanalyze_interval_days,
            "reanalyze_stale_step_days": self.reanalyze_stale_step_days,
            "reanalyze_max_per_run": self.reanalyze_max_per_run,
        }

    def resolved_llm(self) -> tuple[str, str, str, str, bool]:
        """返回 (provider_label, api_key, base_url, model, use_json_mode)。"""
        p = self.llm_provider
        if p == "heuristic":
            return "heuristic", "", "", "", False
        if p == "hunyuan":
            key = self.hunyuan_api_key or self.llm_api_key
            # 避免 .env 里残留的 deepseek-chat 等被误用
            model = self.llm_model if "hunyuan" in (self.llm_model or "").lower() else "hunyuan-lite"
            base = self.llm_base_url or ""
            if base and "deepseek" in base.lower():
                base = ""
            return (
                "hunyuan",
                key,
                base or "https://api.hunyuan.cloud.tencent.com/v1",
                model,
                False,  # 混元用 prompt 约束 JSON，见 stockwise hunyuan_chain
            )
        if p in ("deepseek", "openai", "custom"):
            return (
                p,
                self.llm_api_key,
                self.llm_base_url or "https://api.deepseek.com/v1",
                self.llm_model or "deepseek-chat",
                True,
            )
        raise ValueError(f"未知 LLM_PROVIDER: {p}")
