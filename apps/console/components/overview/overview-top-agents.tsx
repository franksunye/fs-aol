import Link from "next/link";
import { Card } from "@/components/ui/card";
import { agentDetailHref } from "@/lib/agents-nav";
import { overviewAgentsHref } from "@/lib/overview-nav";
import type { OverviewTopAgent } from "@/lib/overview-mock";

export function OverviewTopAgents({ agents }: { agents: OverviewTopAgent[] }) {
  return (
    <Card className="flex h-full flex-col rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Top Agents（按已闭环 Actions）</h2>
      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border text-left text-xs">
              <th className="pb-2 font-medium">Agent</th>
              <th className="pb-2 text-right font-medium">已闭环 Actions</th>
              <th className="pb-2 text-right font-medium">采纳率</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-2">
                  <Link href={agentDetailHref(agent.id)} scroll={false} className="text-foreground hover:text-primary font-medium hover:underline">
                    {agent.name}
                  </Link>
                </td>
                <td className="py-2.5 text-right tabular-nums">{agent.closedActions}</td>
                <td className="py-2.5 text-right tabular-nums">{agent.adoptionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        <Link href={overviewAgentsHref()} scroll={false} className="text-primary hover:underline">
          查看全部 Agents →
        </Link>
      </p>
    </Card>
  );
}
