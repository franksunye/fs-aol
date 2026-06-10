import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { integrationHref } from "@/lib/integrations-nav";
import { overviewIntegrationsHref } from "@/lib/overview-nav";
import type { OverviewIntegrationHealth } from "@/lib/overview-mock";
import { DataStateBadge } from "@/components/data-state-badge";

function HealthBar({ pct, warn }: { pct: number; warn?: boolean }) {
  return (
    <div className="bg-muted h-1.5 w-full min-w-[4rem] overflow-hidden rounded-full">
      <div className={cn("h-full rounded-full", warn ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function OverviewIntegrationHealthPanel({ items }: { items: OverviewIntegrationHealth[] }) {
  return (
    <Card className="flex h-full flex-col rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">集成系统健康度</h2>
        <DataStateBadge state="scenario" />
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border text-left text-xs">
              <th className="pb-2 font-medium">系统</th>
              <th className="pb-2 font-medium">状态</th>
              <th className="pb-2 text-right font-medium">健康度</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-2">
                  <Link href={integrationHref(item.id)} scroll={false} className="text-foreground hover:text-primary font-medium hover:underline">
                    {item.name}
                  </Link>
                </td>
                <td className="py-2.5">
                  <span className={cn("text-xs", item.statusTone === "warn" ? "text-amber-700" : "text-muted-foreground")}>
                    {item.status}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <HealthBar pct={item.healthPct} warn={item.statusTone === "warn"} />
                    <span className="w-8 text-right text-xs tabular-nums">{item.healthPct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        <Link href={overviewIntegrationsHref()} scroll={false} className="text-primary hover:underline">
          查看全部集成 →
        </Link>
      </p>
    </Card>
  );
}
