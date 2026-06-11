import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import type { LiveIntegrationConnector } from "@/lib/integrations-live";
import { cn } from "@/lib/utils";

export function IntegrationsLiveSection({
  connectors,
  snapshotRunAt,
}: {
  connectors: LiveIntegrationConnector[];
  snapshotRunAt: string | null;
}) {
  return (
    <section className="space-y-3" aria-label="Follow-up 真实集成">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Follow-up 运行时集成</h2>
        <DataStateBadge state="live" />
        {snapshotRunAt ? (
          <span className="text-muted-foreground text-xs">
            镜像自引擎 cron · {snapshotRunAt.slice(0, 16).replace("T", " ")}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            尚无引擎快照，请先运行 make cron
          </span>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {connectors.map((c) => (
          <Card key={c.id} className="border-border gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium">{c.name}</h3>
              <DataStateBadge
                state={c.configured ? "live" : "not_connected"}
                className="h-5 shrink-0 px-1.5 text-[10px]"
              />
            </div>
            <p className="text-muted-foreground text-xs">{c.description}</p>
            <p
              className={cn(
                "text-xs font-medium",
                c.statusTone === "warn" && "text-amber-700",
                c.statusTone === "offline" && "text-muted-foreground"
              )}
            >
              {c.status}
            </p>
            {c.detail ? (
              <p className="text-muted-foreground font-mono text-[10px]">
                {c.detail}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
