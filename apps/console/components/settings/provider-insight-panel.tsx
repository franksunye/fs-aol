"use client";

import type { MockLlmProvider } from "@/lib/ai-infrastructure-mock";
import { eventTagClass } from "@/lib/ai-infrastructure-mock";
import { Badge } from "@/components/ui/badge";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import { cn } from "@/lib/utils";

export function ProviderInsightPanel({
  provider,
}: {
  provider: MockLlmProvider;
}) {
  const { health, security, events } = provider;

  return (
    <aside className="space-y-4 xl:sticky xl:top-4">
      <SettingsSectionCard title="健康状态" bodyClassName="space-y-3">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">API 可用性</dt>
            <dd
              className={cn(
                "mt-1 font-semibold tabular-nums",
                health.availabilityTone === "good"
                  ? "text-emerald-600"
                  : "text-amber-700"
              )}
            >
              {health.availability}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">平均延迟</dt>
            <dd className="mt-1 font-semibold tabular-nums">{health.latency}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">错误率</dt>
            <dd className="mt-1 font-semibold tabular-nums">{health.errorRate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">今日配额</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {health.quotaUsedPercent}%
            </dd>
          </div>
        </dl>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${health.quotaUsedPercent}%` }}
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="安全与治理" bodyClassName="space-y-2.5">
        {[
          ["数据保留", security.dataRetention],
          ["PII 脱敏", security.piiMasking],
          ["审计日志", security.auditLogs],
          ["模型访问控制", security.accessControl],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </SettingsSectionCard>

      <SettingsSectionCard title="最近事件" bodyClassName="space-y-3">
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="border-border border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge className={eventTagClass(event.tagTone)}>{event.tag}</Badge>
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
      </SettingsSectionCard>
    </aside>
  );
}
