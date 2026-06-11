import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import type { ModelStrategyLiveStats } from "@/lib/model-strategy-live";

export function ModelStrategyLiveCard({
  stats,
}: {
  stats: ModelStrategyLiveStats | null;
}) {
  if (!stats) {
    return (
      <Card className="border-border mb-4 gap-2 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">近 7 天 Run 聚合</h2>
          <DataStateBadge state="not_connected" />
        </div>
        <p className="text-muted-foreground text-xs">暂无 trace 数据。</p>
      </Card>
    );
  }

  return (
    <Card className="border-border mb-4 gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">近 7 天 Run 聚合（真实）</h2>
        <DataStateBadge state="live" />
        <DataStateBadge state="estimated" label="成本估算" />
      </div>
      <dl className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Runs</dt>
          <dd className="text-lg font-semibold tabular-nums">{stats.runCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">平均延迟</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {(stats.avgLatencyMs / 1000).toFixed(1)}s
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tokens</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {stats.totalTokens.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">估算成本</dt>
          <dd className="text-lg font-semibold tabular-nums">
            ¥{stats.estCostYuan.toFixed(2)}
          </dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-[11px]">
        当前引擎：{stats.agentMode} · {stats.llmProvider} / {stats.llmModel}
      </p>
    </Card>
  );
}
