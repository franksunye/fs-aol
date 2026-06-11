"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";
import {
  saveRuntimeSecrets,
  testConnector,
} from "@/lib/runtime-config/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";

export function WecomLiveCard({
  initial,
}: {
  initial: RuntimeConfigPublic;
}) {
  const [runtime, setRuntime] = useState(initial);
  const [wecomWebhook, setWecomWebhook] = useState("");
  const [busy, setBusy] = useState(false);

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
        <p className="text-muted-foreground text-xs">
          跟进卡片与执行深链通知 · 出站推送
        </p>
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
  );
}
