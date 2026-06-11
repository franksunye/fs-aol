import { FSM_INTEGRATION_ID } from "@/lib/integrations-nav";
import {
  MOCK_INTEGRATIONS,
  type MockIntegration,
} from "@/lib/integrations-mock";
import type { FsmIntegrationView } from "@/lib/integration-bindings/types";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/store";

export type IntegrationRegistryDataState = "live" | "scenario" | "readonly";

export type IntegrationRegistryItem = {
  id: string;
  name: string;
  shortLabel: string;
  brandClassName: string;
  category: MockIntegration["category"];
  categoryLabel: string;
  status: MockIntegration["status"];
  environment: MockIntegration["environment"];
  version: string;
  lastActivity: string;
  dataState: IntegrationRegistryDataState;
  /** Present for scenario connectors from mock SSOT */
  mock?: MockIntegration;
};

const LIVE_FSM_BRAND = "bg-violet-500/10 text-violet-700";
const LIVE_WECOM_BRAND = "bg-emerald-500/10 text-emerald-700";
const LIVE_TURSO_BRAND = "bg-sky-500/10 text-sky-700";

function formatRunAt(iso: string | null): string {
  if (!iso) return "暂无 cron 记录";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "刚刚";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function buildIntegrationRegistry(opts: {
  runtimeConfig: RuntimeConfigPublic | null;
  fsmView: FsmIntegrationView;
  snapshotRunAt: string | null;
  tursoOk: boolean;
}): IntegrationRegistryItem[] {
  const live: IntegrationRegistryItem[] = [
    {
      id: FSM_INTEGRATION_ID,
      name: opts.fsmView.binding.display_name ?? "XLink FSM",
      shortLabel: "FSM",
      brandClassName: LIVE_FSM_BRAND,
      category: "fsm",
      categoryLabel: "FSM",
      status:
        opts.fsmView.syncHealth.status === "live"
          ? "connected"
          : opts.fsmView.syncHealth.status === "degraded"
            ? "abnormal"
            : "pending",
      environment: "Production",
      version: `xlink-fsm@${opts.fsmView.binding.version ?? "v1"}`,
      lastActivity: formatRunAt(opts.snapshotRunAt),
      dataState: "live",
    },
    {
      id: "wecom",
      name: "企业微信",
      shortLabel: "企微",
      brandClassName: LIVE_WECOM_BRAND,
      category: "communication",
      categoryLabel: "沟通",
      status: opts.runtimeConfig?.secretsMasked?.wecom_webhook?.includes("•")
        ? "connected"
        : "pending",
      environment: "Production",
      version: "runtime",
      lastActivity: formatRunAt(opts.snapshotRunAt),
      dataState: "live",
    },
    {
      id: "turso",
      name: "Turso 追踪库",
      shortLabel: "DB",
      brandClassName: LIVE_TURSO_BRAND,
      category: "internal",
      categoryLabel: "内部系统",
      status: opts.tursoOk ? "connected" : "abnormal",
      environment: "Production",
      version: "SQLite/Turso",
      lastActivity: opts.tursoOk ? "连接正常" : "连接异常",
      dataState: "readonly",
    },
  ];

  const scenarioMocks = MOCK_INTEGRATIONS.filter(
    (m) => m.id !== "fsm-core" && m.id !== "wecom"
  ).map(
    (mock): IntegrationRegistryItem => ({
      id: mock.id,
      name: mock.name,
      shortLabel: mock.shortLabel,
      brandClassName: mock.brandClassName,
      category: mock.category,
      categoryLabel: mock.categoryLabel,
      status: mock.status,
      environment: mock.environment,
      version: mock.version,
      lastActivity: mock.lastActivity,
      dataState: "scenario",
      mock,
    })
  );

  return [...live, ...scenarioMocks];
}

export function registryItemToMock(
  item: IntegrationRegistryItem
): MockIntegration | null {
  if (item.mock) return item.mock;
  return null;
}

/** Minimal list shape for IntegrationListPanel filter/sort */
export function registryItemToListIntegration(
  item: IntegrationRegistryItem
): MockIntegration {
  if (item.mock) return item.mock;
  return {
    id: item.id,
    name: item.name,
    shortLabel: item.shortLabel,
    brandClassName: item.brandClassName,
    category: item.category,
    categoryLabel: item.categoryLabel,
    status: item.status,
    environment: item.environment,
    version: item.version,
    lastActivity: item.lastActivity,
    authStatus: item.status === "connected" ? "已配置" : "待配置",
    lastSync: item.lastActivity,
    syncFrequency: "cron",
    dataDirection: item.id === FSM_INTEGRATION_ID ? "只读 inbound" : "—",
    supportedObjects: [],
    mappings: [],
    triggerEvents: [],
    permissions: { readOnly: [], writable: [] },
    health: {
      dataSync: item.status === "connected" ? "正常" : "待配置",
      auth: item.status === "connected" ? "正常" : "待配置",
      apiResponse: "—",
      writeBackSuccess: "—",
      errorRate24h: "—",
    },
    syncSettings: { mode: "—", retry: "—", timezone: "—" },
    events: [],
  };
}
