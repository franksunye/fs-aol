export const RUNTIME_SCOPE_FOLLOW_UP = "follow_up";

export const SECRET_KEYS = [
  "fsm_mongo_url",
  "hunyuan_api_key",
  "llm_api_key",
  "wecom_webhook",
  "wecom_corp_id",
  "wecom_agent_id",
  "wecom_agent_secret",
] as const;

export type SecretKey = (typeof SECRET_KEYS)[number];
export type RuntimeSecrets = Record<SecretKey, string>;

export type BindingOverridesJson = {
  [bindingKey: string]: {
    workbench_display?: {
      enabled_facets?: string[];
    };
  };
};

export type RuntimeConfigJson = {
  binding_overrides?: BindingOverridesJson;
  dry_run: boolean;
  fsm_source: string;
  fsm_mongo_db: string;
  fsm_time_field: string;
  lookback_hours: number;
  fsm_batch_limit: number;
  fsm_max_age_days: number;
  fsm_stale_days: number;
  fsm_event_statuses: string;
  pilot_housekeepers: string;
  pilot_housekeeper_ids: string;
  wecom_webhook_map: string;
  llm_provider: "heuristic" | "hunyuan" | "deepseek";
  llm_model: string;
  llm_base_url: string;
  agent_mode: string;
  console_base_url: string;
  reanalyze_enabled: boolean;
  reanalyze_interval_days: number;
  reanalyze_stale_step_days: number;
  reanalyze_max_per_run: number;
  reanalyze_push: boolean;
  reanalyze_push_on_same_priority: boolean;
};

export type RuntimeConfigPublic = {
  scope: string;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
  config: RuntimeConfigJson;
  secretsMasked: Record<SecretKey, string>;
};

export type RuntimeConfigRow = {
  scope: string;
  config_json: string;
  secrets_ciphertext: string;
  secrets_nonce: string;
  version: number;
  updated_at: string;
  updated_by: string | null;
};
