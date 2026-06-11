import { db, ensureSchema } from "./db";
import { getLatestEngineRuntimeSnapshot } from "./tracking/engine-runtime";

export type LiveIntegrationConnector = {
  id: string;
  name: string;
  description: string;
  status: string;
  statusTone: "normal" | "warn" | "offline";
  healthPct: number;
  configured: boolean;
  detail?: string;
};

export async function loadFollowUpLiveIntegrations(): Promise<{
  connectors: LiveIntegrationConnector[];
  snapshotRunAt: string | null;
}> {
  const snap = await getLatestEngineRuntimeSnapshot();
  const s = snap?.snapshot ?? {};
  const connectors: LiveIntegrationConnector[] = [];

  const mongoConfigured = Boolean(s.fsm_mongo_configured);
  connectors.push({
    id: "xlink-mongo",
    name: "XLink Mongo",
    description: "工单 / 报价 / 签约上下文（FSM 摄取）",
    status: mongoConfigured
      ? `只读 · ${String(s.fsm_mongo_db || "—")}`
      : "未配置",
    statusTone: mongoConfigured ? "normal" : "offline",
    healthPct: mongoConfigured ? 100 : 0,
    configured: mongoConfigured,
    detail: `fsm_source=${String(s.fsm_source ?? "—")}`,
  });

  let tursoOk = false;
  try {
    await ensureSchema();
    await db.execute({ sql: "SELECT 1" });
    tursoOk = true;
  } catch {
    tursoOk = false;
  }
  connectors.push({
    id: "turso-tracking",
    name: "Turso Tracking",
    description: "follow_up_logs / traces / actions 追踪库",
    status: tursoOk ? "连接正常" : "连接失败",
    statusTone: tursoOk ? "normal" : "warn",
    healthPct: tursoOk ? 100 : 0,
    configured: tursoOk,
    detail: `tracking_source=${String(s.tracking_source ?? "local")}`,
  });

  const wecomConfigured = Boolean(s.wecom_configured);
  connectors.push({
    id: "wecom",
    name: "企业微信",
    description: "跟进卡片与执行深链通知",
    status: wecomConfigured
      ? s.dry_run
        ? "DRY_RUN 预览模式"
        : "已配置"
      : "未配置 webhook/应用",
    statusTone: wecomConfigured ? "normal" : "warn",
    healthPct: wecomConfigured ? 95 : 0,
    configured: wecomConfigured,
    detail: s.dry_run ? "dry_run=true" : "dry_run=false",
  });

  return {
    connectors,
    snapshotRunAt: snap?.runAt ?? null,
  };
}
