import type { RuntimeConfigJson, RuntimeSecrets } from "./types";

export function defaultRuntimeConfig(): RuntimeConfigJson {
  return {
    dry_run: true,
    fsm_source: "mongo",
    fsm_mongo_db: "xlinkdemo",
    fsm_time_field: "updateTime",
    lookback_hours: 24,
    fsm_batch_limit: 50,
    fsm_max_age_days: 14,
    fsm_stale_days: 0,
    fsm_event_statuses: "206",
    pilot_housekeepers: "",
    pilot_housekeeper_ids: "",
    wecom_webhook_map: "",
    llm_provider: "hunyuan",
    llm_model: "hunyuan-lite",
    llm_base_url: "",
    agent_mode: "steps",
    console_base_url: "",
    reanalyze_enabled: true,
    reanalyze_interval_days: 3,
    reanalyze_stale_step_days: 7,
    reanalyze_max_per_run: 10,
    reanalyze_push: true,
    reanalyze_push_on_same_priority: false,
  };
}

export function emptySecrets(): RuntimeSecrets {
  return {
    fsm_mongo_url: "",
    hunyuan_api_key: "",
    llm_api_key: "",
    wecom_webhook: "",
    wecom_corp_id: "",
    wecom_agent_id: "",
    wecom_agent_secret: "",
  };
}
