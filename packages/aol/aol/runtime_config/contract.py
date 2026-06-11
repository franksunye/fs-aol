"""Runtime config JSON contract (non-secret fields + secret keys)."""

from __future__ import annotations

import os
from typing import Any, Dict, List

from ..config import Config
from ..util import env_bool

RUNTIME_SCOPE_FOLLOW_UP = "follow_up"

SECRET_KEYS = (
    "fsm_mongo_url",
    "hunyuan_api_key",
    "llm_api_key",
    "wecom_webhook",
    "wecom_corp_id",
    "wecom_agent_id",
    "wecom_agent_secret",
)


def config_from_env(cfg: Config) -> Dict[str, Any]:
    """Build runtime config_json + secrets from env-backed Config."""
    statuses = cfg.fsm_event_statuses or "206"
    return {
        "config": {
            "dry_run": cfg.dry_run,
            "fsm_source": cfg.fsm_source,
            "fsm_mongo_db": cfg.fsm_mongo_db,
            "fsm_time_field": cfg.fsm_time_field,
            "lookback_hours": cfg.lookback_hours,
            "fsm_batch_limit": cfg.fsm_batch_limit,
            "fsm_max_age_days": cfg.fsm_max_age_days,
            "fsm_stale_days": cfg.fsm_stale_days,
            "fsm_event_statuses": statuses,
            "pilot_housekeepers": cfg.pilot_housekeepers,
            "pilot_housekeeper_ids": cfg.pilot_housekeeper_ids,
            "wecom_webhook_map": cfg.wecom_webhook_map,
            "llm_provider": cfg.llm_provider,
            "llm_model": cfg.llm_model,
            "llm_base_url": cfg.llm_base_url,
            "agent_mode": cfg.agent_mode,
            "console_base_url": cfg.console_base_url,
            "reanalyze_enabled": cfg.reanalyze_enabled,
            "reanalyze_interval_days": cfg.reanalyze_interval_days,
            "reanalyze_stale_step_days": cfg.reanalyze_stale_step_days,
            "reanalyze_max_per_run": cfg.reanalyze_max_per_run,
            "reanalyze_push": cfg.reanalyze_push,
            "reanalyze_push_on_same_priority": cfg.reanalyze_push_on_same_priority,
        },
        "secrets": {
            "fsm_mongo_url": cfg.fsm_mongo_url,
            "hunyuan_api_key": cfg.hunyuan_api_key,
            "llm_api_key": cfg.llm_api_key,
            "wecom_webhook": cfg.wecom_webhook,
            "wecom_corp_id": cfg.wecom_corp_id,
            "wecom_agent_id": cfg.wecom_agent_id,
            "wecom_agent_secret": cfg.wecom_agent_secret,
        },
    }


def apply_runtime_to_config(bootstrap: Config, config_json: Dict[str, Any], secrets: Dict[str, str]) -> Config:
    """Merge Turso runtime config into bootstrap Config (bootstrap keeps infra fields)."""
    c = config_json

    def _str(key: str, default: str = "") -> str:
        v = c.get(key, default)
        return str(v) if v is not None else default

    def _int(key: str, default: int) -> int:
        v = c.get(key, default)
        return int(v) if v is not None else default

    def _bool(key: str, default: bool) -> bool:
        v = c.get(key, default)
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("1", "true", "yes", "on")
        return bool(v) if v is not None else default

    statuses = c.get("fsm_event_statuses", "206")
    if isinstance(statuses, list):
        statuses = ",".join(str(s).strip() for s in statuses if str(s).strip())

    return Config(
        dry_run=_bool("dry_run", bootstrap.dry_run),
        fsm_source=_str("fsm_source", bootstrap.fsm_source).lower(),
        fsm_mongo_url=secrets.get("fsm_mongo_url", bootstrap.fsm_mongo_url),
        fsm_mongo_db=_str("fsm_mongo_db", bootstrap.fsm_mongo_db),
        fsm_time_field=_str("fsm_time_field", bootstrap.fsm_time_field),
        lookback_hours=_int("lookback_hours", bootstrap.lookback_hours),
        fsm_batch_limit=_int("fsm_batch_limit", bootstrap.fsm_batch_limit),
        fsm_max_age_days=_int("fsm_max_age_days", bootstrap.fsm_max_age_days),
        fsm_stale_days=_int("fsm_stale_days", bootstrap.fsm_stale_days),
        fsm_event_statuses=str(statuses),
        pilot_housekeepers=_str("pilot_housekeepers", bootstrap.pilot_housekeepers),
        pilot_housekeeper_ids=_str("pilot_housekeeper_ids", bootstrap.pilot_housekeeper_ids),
        wecom_webhook_map=_str("wecom_webhook_map", bootstrap.wecom_webhook_map),
        tracking_source=bootstrap.tracking_source,
        tracking_local_path=bootstrap.tracking_local_path,
        turso_url=bootstrap.turso_url,
        turso_token=bootstrap.turso_token,
        llm_provider=_str("llm_provider", bootstrap.llm_provider).lower(),
        llm_api_key=secrets.get("llm_api_key", bootstrap.llm_api_key),
        llm_base_url=_str("llm_base_url", bootstrap.llm_base_url),
        llm_model=_str("llm_model", bootstrap.llm_model),
        hunyuan_api_key=secrets.get("hunyuan_api_key", bootstrap.hunyuan_api_key),
        agent_mode=_str("agent_mode", bootstrap.agent_mode).lower(),
        wecom_webhook=secrets.get("wecom_webhook", bootstrap.wecom_webhook),
        wecom_corp_id=secrets.get("wecom_corp_id", bootstrap.wecom_corp_id),
        wecom_agent_id=secrets.get("wecom_agent_id", bootstrap.wecom_agent_id),
        wecom_agent_secret=secrets.get("wecom_agent_secret", bootstrap.wecom_agent_secret),
        console_base_url=_str("console_base_url", bootstrap.console_base_url).rstrip("/"),
        reanalyze_enabled=_bool("reanalyze_enabled", bootstrap.reanalyze_enabled),
        reanalyze_interval_days=_int("reanalyze_interval_days", bootstrap.reanalyze_interval_days),
        reanalyze_stale_step_days=_int("reanalyze_stale_step_days", bootstrap.reanalyze_stale_step_days),
        reanalyze_max_per_run=_int("reanalyze_max_per_run", bootstrap.reanalyze_max_per_run),
        reanalyze_push=_bool("reanalyze_push", bootstrap.reanalyze_push),
        reanalyze_push_on_same_priority=_bool(
            "reanalyze_push_on_same_priority", bootstrap.reanalyze_push_on_same_priority
        ),
    )


def encryption_key_from_env() -> str:
    return os.getenv("AOL_CONFIG_ENCRYPTION_KEY", "").strip()


def config_fallback_env() -> bool:
    return env_bool("CONFIG_FALLBACK_ENV", False)
