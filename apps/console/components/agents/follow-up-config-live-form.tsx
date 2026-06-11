"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import { FsmConfigMirrorCard } from "@/components/integrations/fsm-config-mirror-card";
import {
  rollbackRuntimeConfig,
  saveRuntimeConfig,
  type RuntimeConfigPublic,
} from "@/lib/runtime-config/client";

export function FollowUpConfigLiveForm({
  initial,
}: {
  initial: RuntimeConfigPublic;
}) {
  const [runtime, setRuntime] = useState(initial);
  const [form, setForm] = useState({
    dry_run: initial.config.dry_run,
    agent_mode: initial.config.agent_mode,
    console_base_url: initial.config.console_base_url,
    reanalyze_enabled: initial.config.reanalyze_enabled,
  });
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      const next = await saveRuntimeConfig(form, "Agent settings updated");
      setRuntime(next);
      setForm({
        dry_run: next.config.dry_run,
        agent_mode: next.config.agent_mode,
        console_base_url: next.config.console_base_url,
        reanalyze_enabled: next.config.reanalyze_enabled,
      });
      toast.success("已保存", { description: "下轮 cron 生效" });
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
      setForm({
        dry_run: next.config.dry_run,
        agent_mode: next.config.agent_mode,
        console_base_url: next.config.console_base_url,
        reanalyze_enabled: next.config.reanalyze_enabled,
      });
      toast.success(`已回滚到 v${target}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "回滚失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <FsmConfigMirrorCard runtime={runtime} />

      <Card className="gap-0 py-0">
        <CardContent className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Agent 运行时（可编辑）</h2>
            <DataStateBadge state="live" />
            <span className="text-muted-foreground text-xs">
              v{runtime.version}
            </span>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.dry_run}
              onChange={(e) =>
                setForm((f) => ({ ...f, dry_run: e.target.checked }))
              }
            />
            DRY_RUN（勾选=企微仅预览，不真发）
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium">
              agent_mode
              <select
                className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.agent_mode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, agent_mode: e.target.value }))
                }
              >
                <option value="oneshot">oneshot</option>
                <option value="steps">steps</option>
              </select>
            </label>
          </div>

          <label className="text-xs font-medium">
            Console 深链 BASE URL
            <input
              className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.console_base_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, console_base_url: e.target.value }))
              }
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.reanalyze_enabled}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  reanalyze_enabled: e.target.checked,
                }))
              }
            />
            启用时间触发再分析
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={handleSave}>
              保存配置
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={handleRollback}
            >
              回滚上一版
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
