"use client";

import { CheckCircle2 } from "lucide-react";
import type { MockIntegration } from "@/lib/integrations-mock";
import {
  integrationEventTagClass,
} from "@/lib/integrations-mock";
import { Badge } from "@/components/ui/badge";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import { cn } from "@/lib/utils";

function HealthItem({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium",
          ok === true
            ? "text-emerald-600"
            : ok === false
              ? "text-amber-700"
              : "text-foreground"
        )}
      >
        {ok === true ? (
          <CheckCircle2 className="size-3.5" aria-hidden />
        ) : null}
        {value}
      </span>
    </div>
  );
}

export function IntegrationInsightPanel({
  integration,
}: {
  integration: MockIntegration;
}) {
  const { health, syncSettings, events } = integration;
  const healthOk = (v: string) => v === "正常";

  return (
    <aside className="space-y-4 xl:sticky xl:top-4">
      <SettingsSectionCard title="同步健康" bodyClassName="space-y-2.5">
        <HealthItem
          label="数据同步"
          value={health.dataSync}
          ok={healthOk(health.dataSync)}
        />
        <HealthItem
          label="授权状态"
          value={health.auth}
          ok={healthOk(health.auth)}
        />
        <HealthItem
          label="API 响应"
          value={health.apiResponse}
          ok={healthOk(health.apiResponse)}
        />
        <div className="border-border my-2 border-t" />
        <HealthItem label="写回成功率" value={health.writeBackSuccess} />
        <HealthItem label="错误率（24h）" value={health.errorRate24h} />
      </SettingsSectionCard>

      <SettingsSectionCard title="最近事件" bodyClassName="space-y-3">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无事件</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="border-border border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge className={integrationEventTagClass(event.tagTone)}>
                    {event.tag}
                  </Badge>
                  <span className="text-muted-foreground text-[11px] tabular-nums">
                    {event.at}
                  </span>
                </div>
                <p className="text-foreground mt-1.5 text-xs leading-relaxed">
                  {event.title}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard title="同步设置" bodyClassName="space-y-2.5">
        {[
          ["同步模式", syncSettings.mode],
          ["重试策略", syncSettings.retry],
          ["时区", syncSettings.timezone],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </SettingsSectionCard>
    </aside>
  );
}
