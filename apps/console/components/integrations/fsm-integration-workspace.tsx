"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { History, Save } from "lucide-react";
import type { FsmIntegrationView } from "@/lib/integration-bindings/types";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";
import {
  rollbackRuntimeConfig,
  saveRuntimeConfig,
  saveRuntimeSecrets,
  testConnector,
} from "@/lib/runtime-config/client";
import type { RuntimeConfigJson } from "@/lib/runtime-config/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { IntegrationProtocolPanel } from "./integration-protocol-panel";

const HEALTH_LABEL = {
  live: "运行正常",
  degraded: "部分失败",
  not_connected: "未配置",
} as const;

const INGESTION_HINTS: Partial<Record<keyof RuntimeConfigJson, string>> = {
  fsm_event_statuses: "逗号分隔状态码，如 206=跟进签约",
  fsm_stale_days: "停留超过此天数才触发跟进",
  fsm_max_age_days: "仅捞取最近 N 天内更新的工单",
  fsm_time_field: "Mongo 时间字段，通常 updateTime",
  lookback_hours: "无 stale/max_age 时按小时回看",
  fsm_batch_limit: "每轮 cron 最大捞取条数",
  pilot_housekeepers: "试点管家姓名，逗号分隔",
};

type TabId = "connection" | "ingestion" | "protocol" | "health";

export function FsmIntegrationWorkspace({
  initial,
  view,
  defaultTab = "connection",
}: {
  initial: RuntimeConfigPublic;
  view: FsmIntegrationView;
  defaultTab?: TabId;
}) {
  const [runtime, setRuntime] = useState(initial);
  const [connectionForm, setConnectionForm] = useState({
    mongoUrl: "",
    mongoDb: initial.config.fsm_mongo_db,
    fsm_source: initial.config.fsm_source,
  });
  const [ingestionForm, setIngestionForm] = useState({
    fsm_event_statuses: initial.config.fsm_event_statuses,
    fsm_stale_days: initial.config.fsm_stale_days,
    fsm_max_age_days: initial.config.fsm_max_age_days,
    fsm_time_field: initial.config.fsm_time_field,
    lookback_hours: initial.config.lookback_hours,
    fsm_batch_limit: initial.config.fsm_batch_limit,
    pilot_housekeepers: initial.config.pilot_housekeepers,
  });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabId>(defaultTab);

  const connectionDirty = useMemo(
    () =>
      connectionForm.mongoDb !== runtime.config.fsm_mongo_db ||
      connectionForm.fsm_source !== runtime.config.fsm_source ||
      connectionForm.mongoUrl.trim().length > 0,
    [connectionForm, runtime.config]
  );

  const ingestionDirty = useMemo(() => {
    const c = runtime.config;
    const f = ingestionForm;
    return (
      f.fsm_event_statuses !== c.fsm_event_statuses ||
      f.fsm_stale_days !== c.fsm_stale_days ||
      f.fsm_max_age_days !== c.fsm_max_age_days ||
      f.fsm_time_field !== c.fsm_time_field ||
      f.lookback_hours !== c.lookback_hours ||
      f.fsm_batch_limit !== c.fsm_batch_limit ||
      f.pilot_housekeepers !== c.pilot_housekeepers
    );
  }, [ingestionForm, runtime.config]);

  const tabDirty =
    (tab === "connection" && connectionDirty) ||
    (tab === "ingestion" && ingestionDirty);

  async function saveConnection() {
    setBusy(true);
    try {
      let next = await saveRuntimeConfig(
        {
          fsm_mongo_db: connectionForm.mongoDb,
          fsm_source: connectionForm.fsm_source,
        },
        "FSM connection updated"
      );
      if (connectionForm.mongoUrl.trim()) {
        next = await saveRuntimeSecrets(
          { fsm_mongo_url: connectionForm.mongoUrl.trim() },
          "FSM Mongo URL updated"
        );
        setConnectionForm((f) => ({ ...f, mongoUrl: "" }));
      }
      setRuntime(next);
      toast.success("连接配置已保存", { description: "下轮 cron 生效" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveIngestion() {
    setBusy(true);
    try {
      const next = await saveRuntimeConfig(
        ingestionForm,
        "FSM ingestion policy updated"
      );
      setRuntime(next);
      setIngestionForm({
        fsm_event_statuses: next.config.fsm_event_statuses,
        fsm_stale_days: next.config.fsm_stale_days,
        fsm_max_age_days: next.config.fsm_max_age_days,
        fsm_time_field: next.config.fsm_time_field,
        lookback_hours: next.config.lookback_hours,
        fsm_batch_limit: next.config.fsm_batch_limit,
        pilot_housekeepers: next.config.pilot_housekeepers,
      });
      toast.success("摄取策略已保存", { description: "下轮 cron 生效" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleRollback() {
    if (runtime.version <= 1) {
      toast.message("无可回滚版本");
      return;
    }
    setBusy(true);
    try {
      const target = runtime.version - 1;
      const next = await rollbackRuntimeConfig(target);
      setRuntime(next);
      setConnectionForm((f) => ({
        ...f,
        mongoDb: next.config.fsm_mongo_db,
        fsm_source: next.config.fsm_source,
      }));
      setIngestionForm({
        fsm_event_statuses: next.config.fsm_event_statuses,
        fsm_stale_days: next.config.fsm_stale_days,
        fsm_max_age_days: next.config.fsm_max_age_days,
        fsm_time_field: next.config.fsm_time_field,
        lookback_hours: next.config.lookback_hours,
        fsm_batch_limit: next.config.fsm_batch_limit,
        pilot_housekeepers: next.config.pilot_housekeepers,
      });
      toast.success(`已回滚到 v${target}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "回滚失败");
    } finally {
      setBusy(false);
    }
  }

  const health = view.syncHealth;

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sky-500/10 text-sky-700 flex size-10 items-center justify-center rounded-xl text-sm font-bold">
                FSM
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {view.binding.display_name}
                </h2>
                <p className="text-muted-foreground text-xs">
                  binding {view.binding.id}@{view.binding.version}
                </p>
              </div>
              <DataStateBadge state="live" />
              <Badge
                variant="outline"
                className={cn(
                  health.status === "live" && "border-emerald-200 text-emerald-700",
                  health.status === "degraded" && "border-amber-200 text-amber-800",
                  health.status === "not_connected" &&
                    "border-amber-200 text-amber-800"
                )}
              >
                {HEALTH_LABEL[health.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{view.humanSummary}</p>
            {health.lastRunAt ? (
              <p className="text-muted-foreground mt-1 text-xs">
                上次 cron · {health.lastRunAt.slice(0, 16).replace("T", " ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || runtime.version <= 1}
              onClick={handleRollback}
            >
              <History className="size-3.5" />
              回滚 v{runtime.version > 1 ? runtime.version - 1 : "—"}
            </Button>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabId)}
          className="gap-4"
        >
          <TabsList variant="line">
            <TabsTrigger value="connection">连接</TabsTrigger>
            <TabsTrigger value="ingestion">摄取策略</TabsTrigger>
            <TabsTrigger value="protocol">集成协议</TabsTrigger>
            <TabsTrigger value="health">同步健康</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <p className="text-muted-foreground text-sm">
              只读连接 XLink Mongo · 当前库{" "}
              <span className="font-mono">{runtime.config.fsm_mongo_db}</span>
            </p>
            <label className="block text-xs font-medium">
              Mongo URL（留空保留 · 当前{" "}
              {runtime.secretsMasked.fsm_mongo_url || "未配置"}）
              <input
                type="password"
                className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={connectionForm.mongoUrl}
                onChange={(e) =>
                  setConnectionForm((f) => ({ ...f, mongoUrl: e.target.value }))
                }
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium">
                Database
                <input
                  className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                  value={connectionForm.mongoDb}
                  onChange={(e) =>
                    setConnectionForm((f) => ({ ...f, mongoDb: e.target.value }))
                  }
                />
              </label>
              <label className="text-xs font-medium">
                fsm_source
                <input
                  className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                  value={connectionForm.fsm_source}
                  onChange={(e) =>
                    setConnectionForm((f) => ({
                      ...f,
                      fsm_source: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy || !connectionDirty}
                onClick={saveConnection}
              >
                <Save className="size-3.5" />
                保存连接
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  const r = await testConnector("mongo", {
                    config: { fsm_mongo_db: connectionForm.mongoDb },
                    secrets: connectionForm.mongoUrl
                      ? { fsm_mongo_url: connectionForm.mongoUrl }
                      : undefined,
                  });
                  r.ok ? toast.success(r.message) : toast.error(r.message);
                }}
              >
                测试连接
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ingestion" className="space-y-4">
            <p className="text-muted-foreground text-sm">
              定义从业务系统捞取哪些工单进入 Follow-up Agent。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(ingestionForm) as (keyof typeof ingestionForm)[]).map(
                (key) => (
                  <label key={key} className="text-xs font-medium">
                    {key}
                    {INGESTION_HINTS[key] ? (
                      <span className="text-muted-foreground block font-normal">
                        {INGESTION_HINTS[key]}
                      </span>
                    ) : null}
                    <input
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                      value={String(ingestionForm[key])}
                      onChange={(e) =>
                        setIngestionForm((f) => ({
                          ...f,
                          [key]:
                            key === "fsm_event_statuses" ||
                            key === "fsm_time_field" ||
                            key === "pilot_housekeepers"
                              ? e.target.value
                              : Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                )
              )}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={busy || !ingestionDirty}
              onClick={saveIngestion}
            >
              <Save className="size-3.5" />
              保存摄取策略
            </Button>
          </TabsContent>

          <TabsContent value="protocol">
            <IntegrationProtocolPanel
              binding={view.binding}
              activeEventStatuses={view.activeEventStatuses}
            />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            {!health.lastRunAt ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <DataStateBadge state="not_connected" className="mb-2" />
                <p className="text-muted-foreground text-sm">
                  尚无引擎 cron 快照。请运行{" "}
                  <code className="text-xs">make cron</code> 后刷新。
                </p>
              </div>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["processed", "本轮处理", health.processed],
                  ["success", "成功", health.success],
                  ["failed", "失败", health.failed],
                  ["skipped", "跳过", health.skipped],
                ].map(([k, label, val]) => (
                  <div key={k} className="rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {val ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {health.inboxSync ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium">收件箱同步</p>
                <pre className="text-muted-foreground mt-1 overflow-auto font-mono text-[10px]">
                  {JSON.stringify(health.inboxSync, null, 2)}
                </pre>
              </div>
            ) : null}
            {health.timelineSync ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium">时间轴同步</p>
                <pre className="text-muted-foreground mt-1 overflow-auto font-mono text-[10px]">
                  {JSON.stringify(health.timelineSync, null, 2)}
                </pre>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>

        {tabDirty ? (
          <p className="text-amber-700 text-xs">有未保存的更改</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
