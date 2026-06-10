import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { agentDetailHref } from "@/lib/agents-nav";
import { overviewRunsHref } from "@/lib/overview-nav";
import type {
  OverviewAgentFleetItem,
  OverviewAgentRunState,
} from "@/lib/overview-mock";

const STATE_STYLES: Record<
  OverviewAgentRunState,
  { dot: string; badge: string }
> = {
  healthy: {
    dot: "bg-emerald-500",
    badge: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
  },
  warn: {
    dot: "bg-amber-500",
    badge: "border-amber-200/80 bg-amber-50 text-amber-800",
  },
  offline: {
    dot: "bg-muted-foreground/50",
    badge: "border-border bg-muted text-muted-foreground",
  },
  draft: {
    dot: "bg-sky-400",
    badge: "border-sky-200/80 bg-sky-50 text-sky-800",
  },
};

function AgentFleetCard({ agent }: { agent: OverviewAgentFleetItem }) {
  const styles = STATE_STYLES[agent.runState];
  const href =
    agent.runState === "warn" || agent.runState === "offline"
      ? overviewRunsHref()
      : agentDetailHref(agent.agentHrefId);

  return (
    <Link href={href} scroll={false} className="block min-w-0">
      <Card className="h-full gap-2 rounded-xl border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-snug">{agent.name}</p>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              最近 {agent.lastRunLabel}
            </p>
          </div>
          <span
            className={cn("mt-1 size-2 shrink-0 rounded-full", styles.dot)}
            aria-hidden
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              styles.badge
            )}
          >
            {agent.statusLabel}
          </span>
          <span className="text-muted-foreground text-[10px] tabular-nums">
            今日 {agent.runsToday} Runs
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function OverviewAgentFleet({
  agents,
}: {
  agents: OverviewAgentFleetItem[];
}) {
  return (
    <section
      className="grid grid-cols-2 gap-2 xl:grid-cols-4"
      aria-label="Agent 运行状态"
    >
      {agents.map((agent) => (
        <AgentFleetCard key={agent.id} agent={agent} />
      ))}
    </section>
  );
}
