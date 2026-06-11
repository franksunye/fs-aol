export type BindingTransformOp =
  | "direct"
  | "lookup"
  | "coalesce"
  | "const"
  | "source_ref";

export type BindingField = {
  to: string;
  from?: string;
  paths?: string[];
  op: BindingTransformOp;
  table?: string;
  value?: unknown;
  description?: string;
};

export type IntegrationBinding = {
  id: string;
  version: string;
  display_name: string;
  connector: string;
  direction: string;
  connection_keys: string[];
  ingestion_keys: string[];
  objects: {
    id: string;
    canonical: { type: string; label: string };
    external: { collection: string; label: string };
    identity?: {
      external_paths?: string[];
      canonical_field?: string;
    };
    fields: BindingField[];
    enrichment?: {
      canonical: string;
      source: string;
      via: string;
      phase: string;
    }[];
  }[];
  code_tables: Record<string, Record<string, string>>;
  event_rules?: {
    trigger_field: string;
    lookup_table: string;
    labels: Record<string, string>;
  };
  ingestion: {
    system_name: string;
    collection: string;
    state_active: number;
    projection: Record<string, number>;
    query: Record<string, string>;
    sample_documents?: Record<string, unknown>[];
  };
  write_back: { enabled: boolean; capabilities: string[] };
};

export type MappedWorkOrder = {
  work_order_id: string;
  order_num: string;
  title: string;
  task_type: string;
  group: string;
  city: string;
  customer_name: string;
  phone: string;
  assignee: string;
  summary: string;
  completed_at: string;
  event_type: string;
  housekeeper_id: string;
  source_ref: Record<string, string>;
};

export type FsmSyncHealth = {
  status: "live" | "degraded" | "not_connected";
  lastRunAt: string | null;
  processed: number | null;
  success: number | null;
  failed: number | null;
  skipped: number | null;
  inboxSync: Record<string, unknown> | null;
  timelineSync: Record<string, unknown> | null;
  mongoConfigured: boolean;
};

export type FsmIntegrationView = {
  binding: IntegrationBinding;
  bindingId: string;
  runtimeVersion: number | null;
  activeEventStatuses: string[];
  syncHealth: FsmSyncHealth;
  humanSummary: string;
};
