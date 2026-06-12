import type { RuntimeConfigPublic } from "@/lib/runtime-config/types";
import type { EngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";
import { loadBinding } from "./load";
import type { FsmIntegrationView, FsmSyncHealth } from "./types";
import { mergeWorkbenchDisplay } from "./workbench-display";

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function loadFsmSyncHealth(
  runtime: RuntimeConfigPublic | null,
  snapshot: EngineRuntimeSnapshot | null
): FsmSyncHealth {
  const mongoConfigured = Boolean(runtime?.secretsMasked.fsm_mongo_url);
  const summary = snapshot?.runSummary ?? null;
  const failed = summary ? num(summary.failed) : null;

  let status: FsmSyncHealth["status"] = "not_connected";
  if (mongoConfigured) {
    status = failed != null && failed > 0 ? "degraded" : "live";
  }

  return {
    status,
    lastRunAt: snapshot?.runAt ?? null,
    processed: summary ? num(summary.processed) : null,
    success: summary ? num(summary.success) : null,
    failed,
    skipped: summary ? num(summary.skipped) : null,
    inboxSync:
      (summary?.inbox_sync as Record<string, unknown> | undefined) ?? null,
    timelineSync:
      (summary?.timeline_sync as Record<string, unknown> | null) ?? null,
    mongoConfigured,
  };
}

function parseEventStatuses(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["206"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildHumanSummary(
  binding: ReturnType<typeof loadBinding>,
  statuses: string[],
  config: RuntimeConfigPublic["config"] | null
): string {
  const coll = binding.ingestion.collection;
  const parts = [`从 ${coll} 只读拉取 status∈{${statuses.join(",")}}`];
  if (config?.fsm_stale_days && config.fsm_stale_days > 0) {
    parts.push(`停留>${config.fsm_stale_days}天`);
  }
  if (config?.fsm_max_age_days && config.fsm_max_age_days > 0) {
    parts.push(`最近${config.fsm_max_age_days}天内`);
  }
  if (config?.pilot_housekeepers?.trim()) {
    parts.push(`试点管家：${config.pilot_housekeepers}`);
  }
  return parts.join(" · ");
}

export function mergeFsmLiveView(
  runtime: RuntimeConfigPublic | null,
  snapshot: EngineRuntimeSnapshot | null
): FsmIntegrationView {
  const binding = loadBinding("xlink-fsm");
  const statuses = parseEventStatuses(runtime?.config.fsm_event_statuses);
  return {
    binding,
    bindingId: "xlink-fsm",
    runtimeVersion: runtime?.version ?? null,
    activeEventStatuses: statuses,
    syncHealth: loadFsmSyncHealth(runtime, snapshot),
    humanSummary: buildHumanSummary(binding, statuses, runtime?.config ?? null),
    workbenchDisplay: mergeWorkbenchDisplay(
      binding,
      runtime?.config.binding_overrides
    ),
  };
}
