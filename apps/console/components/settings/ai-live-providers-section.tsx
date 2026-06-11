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
import type { RuntimeConfigJson } from "@/lib/runtime-config/types";

const LIVE_PROVIDERS = [
  {
    id: "heuristic" as const,
    name: "Heuristic",
    label: "启发式（零 API）",
    models: ["—"],
  },
  {
    id: "hunyuan" as const,
    name: "混元 Lite",
    label: "腾讯混元",
    models: ["hunyuan-lite"],
  },
  {
    id: "deepseek" as const,
    name: "DeepSeek",
    label: "DeepSeek Chat",
    models: ["deepseek-chat"],
  },
];

export function AiLiveProvidersSection({
  initial,
  onSaved,
}: {
  initial: RuntimeConfigPublic;
  onSaved?: (r: RuntimeConfigPublic) => void;
}) {
  const [runtime, setRuntime] = useState(initial);
  const [provider, setProvider] = useState(runtime.config.llm_provider);
  const [model, setModel] = useState(runtime.config.llm_model);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);

  const active = runtime.config.llm_provider;

  async function handleSave() {
    setBusy(true);
    try {
      const config: Partial<RuntimeConfigJson> = {
        llm_provider: provider,
        llm_model:
          provider === "hunyuan"
            ? model || "hunyuan-lite"
            : provider === "deepseek"
              ? model || "deepseek-chat"
              : "",
      };
      let next = await saveRuntimeConfig(config, `AI provider → ${provider}`);
      if (apiKey.trim()) {
        const secrets =
          provider === "hunyuan"
            ? { hunyuan_api_key: apiKey.trim() }
            : { llm_api_key: apiKey.trim() };
        next = await saveRuntimeSecrets(secrets, "AI API key updated");
        setApiKey("");
      }
      setRuntime(next);
      onSaved?.(next);
      toast.success("已保存", {
        description: "下轮 cron 将使用新配置",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    try {
      const secrets =
        apiKey.trim() && provider === "hunyuan"
          ? { hunyuan_api_key: apiKey.trim() }
          : apiKey.trim()
            ? { llm_api_key: apiKey.trim() }
            : undefined;
      const result = await testConnector("llm", {
        config: {
          llm_provider: provider,
          llm_model: model,
        },
        secrets,
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "测试失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Follow-up LLM（可编辑）</h2>
        <DataStateBadge state="live" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {LIVE_PROVIDERS.map((p) => (
          <Card
            key={p.id}
            className={`cursor-pointer gap-0 py-0 transition-colors ${
              provider === p.id ? "ring-primary ring-2" : ""
            }`}
            onClick={() => {
              setProvider(p.id);
              if (p.models[0] !== "—") setModel(p.models[0]);
            }}
          >
            <CardContent className="space-y-2 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{p.name}</span>
                {active === p.id ? (
                  <DataStateBadge state="live" label="运行中" />
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{p.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {provider !== "heuristic" ? (
        <div className="grid max-w-lg gap-2">
          <label className="text-xs font-medium">
            模型
            <input
              className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            API Key（留空则保留已保存）
            <input
              type="password"
              className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              placeholder={
                provider === "hunyuan"
                  ? runtime.secretsMasked.hunyuan_api_key || "未配置"
                  : runtime.secretsMasked.llm_api_key || "未配置"
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={handleSave}>
          保存配置
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={handleTest}
        >
          测试连接
        </Button>
      </div>
    </div>
  );
}
