import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  budgetUsagePct,
  formatBudgetYuan,
  type AuditLogEntry,
  type GovernanceSummary,
  type RiskAlert,
} from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";

function AuditLogList({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <SettingsSectionCard title="最近审计日志">
      <ul className="space-y-3">
        {entries.map((entry) => {
          const content = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  entry.avatarClassName
                )}
                aria-hidden
              >
                {entry.userInitials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{entry.userName}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {entry.action}
                </div>
              </div>
              <time className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                {entry.timestamp}
              </time>
            </>
          );

          return (
            <li key={entry.id}>
              {entry.href ? (
                <Link
                  href={entry.href}
                  className="hover:bg-muted/50 -mx-1 flex items-start gap-2.5 rounded-lg px-1 py-1 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-start gap-2.5">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </SettingsSectionCard>
  );
}

function RiskAlerts({ alerts }: { alerts: RiskAlert[] }) {
  return (
    <SettingsSectionCard title="风险提醒">
      <ul className="space-y-2.5">
        {alerts.map((alert) => {
          const isHigh = alert.level === "high";
          const node = (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed",
                isHigh
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              )}
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{alert.message}</span>
            </div>
          );

          return (
            <li key={alert.id}>
              {alert.href ? (
                <Link href={alert.href} className="block hover:opacity-90">
                  {node}
                </Link>
              ) : (
                node
              )}
            </li>
          );
        })}
      </ul>
    </SettingsSectionCard>
  );
}

function BudgetWidget({ summary }: { summary: GovernanceSummary }) {
  const pct = budgetUsagePct(summary.budgetUsedYuan, summary.monthlyBudgetYuan);
  const warningYuan = Math.round(
    (summary.monthlyBudgetYuan * summary.budgetWarningPct) / 100
  );

  return (
    <SettingsSectionCard title="预算与限额">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-foreground text-lg font-semibold tabular-nums">
            {formatBudgetYuan(summary.budgetUsedYuan)}
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            / {formatBudgetYuan(summary.monthlyBudgetYuan)} ({pct}%)
          </span>
        </div>

        <div className="relative">
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div
            className="bg-amber-400 absolute top-0 h-2 w-0.5 -translate-x-1/2"
            style={{ left: `${summary.budgetWarningPct}%` }}
            aria-hidden
          />
        </div>

        <div className="text-muted-foreground space-y-1 text-[11px] leading-relaxed">
          <p>
            预警阈值 {summary.budgetWarningPct}% ·{" "}
            {formatBudgetYuan(warningYuan)}
          </p>
          <p>
            硬性限额 {summary.budgetHardLimitPct}% ·{" "}
            {formatBudgetYuan(summary.monthlyBudgetYuan)}
          </p>
        </div>
      </div>
    </SettingsSectionCard>
  );
}

export function GovernanceSidebar({
  auditLogs,
  riskAlerts,
  summary,
}: {
  auditLogs: AuditLogEntry[];
  riskAlerts: RiskAlert[];
  summary: GovernanceSummary;
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-4">
      <AuditLogList entries={auditLogs} />
      <RiskAlerts alerts={riskAlerts} />
      <BudgetWidget summary={summary} />
    </aside>
  );
}
