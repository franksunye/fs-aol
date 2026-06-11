"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import {
  saveRuntimeConfig,
  saveRuntimeSecrets,
  testConnector,
  type RuntimeConfigPublic,
} from "@/lib/runtime-config/client";

export function IntegrationsLiveEditor({
  initial,
  tursoOk,
}: {
  initial: RuntimeConfigPublic;
  tursoOk: boolean;
}) {
  const [runtime, setRuntime] = useState(initial);
  const [mongoUrl, setMongoUrl] = useState("");
  const [mongoDb, setMongoDb] = useState(runtime.config.fsm_mongo_db);
  const [wecomWebhook, setWecomWebhook] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveMongo() {
    setBusy(true);
    try {
      let next = await saveRuntimeConfig(
        { fsm_mongo_db: mongoDb },
        "Mongo DB updated"
      );
      if (mongoUrl.trim()) {
        next = await saveRuntimeSecrets(
          { fsm_mongo_url: mongoUrl.trim() },
          "Mongo URL updated"
        );
        setMongoUrl("");
      }
      setRuntime(next);
      toast.success("Mongo 配置已保存");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveWecom() {
    setBusy(true);
    try {
      let next = runtime;
      if (wecomWebhook.trim()) {
        next = await saveRuntimeSecrets(
          { wecom_webhook: wecomWebhook.trim() },
          "WeCom webhook updated"
        );
        setWecomWebhook("");
      }
      setRuntime(next);
      toast.success("企微配置已保存");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Follow-up 运行时集成</h2>
        <DataStateBadge state="live" />
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">XLink Mongo</span>
            <DataStateBadge
              state={runtime.secretsMasked.fsm_mongo_url ? "live" : "not_connected"}
            />
          </div>
          <label className="block text-xs">
            Mongo URL（留空保留已保存 · 当前 {runtime.secretsMasked.fsm_mongo_url || "—"}）
            <input
              type="password"
              className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={mongoUrl}
              onChange={(e) => setMongoUrl(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Database
            <input
              className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={mongoDb}
              onChange={(e) => setMongoDb(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={saveMongo}>
              保存
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                const r = await testConnector("mongo", {
                  config: { fsm_mongo_db: mongoDb },
                  secrets: mongoUrl ? { fsm_mongo_url: mongoUrl } : undefined,
                });
                r.ok ? toast.success(r.message) : toast.error(r.message);
              }}
            >
              测试连接
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Turso Tracking</span>
            <DataStateBadge state={tursoOk ? "live" : "not_connected"} />
          </div>
          <p className="text-muted-foreground text-xs">
            连接由部署 bootstrap（LIBSQL_URL）管理，此处只读探测。
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">企业微信</span>
            <DataStateBadge
              state={
                runtime.secretsMasked.wecom_webhook ? "live" : "not_connected"
              }
            />
          </div>
          <label className="block text-xs">
            Webhook（当前 {runtime.secretsMasked.wecom_webhook || "—"}）
            <input
              type="password"
              className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={wecomWebhook}
              onChange={(e) => setWecomWebhook(e.target.value)}
            />
          </label>
          <p className="text-muted-foreground text-xs">
            DRY_RUN={String(runtime.config.dry_run)}（在 Agent 设置中修改）
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={saveWecom}>
              保存
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                const r = await testConnector("wecom", {
                  secrets: wecomWebhook
                    ? { wecom_webhook: wecomWebhook }
                    : undefined,
                });
                r.ok ? toast.success(r.message) : toast.error(r.message);
              }}
            >
              测试连接
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
