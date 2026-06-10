import type { ReactNode } from "react";
import { Box, Coins, Cpu, Server } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AI_INFRA_SUMMARY } from "@/lib/ai-infrastructure-mock";

function SummaryCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <Card className="gap-2 rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-muted-foreground text-xs font-medium">{label}</div>
        <span
          className={`flex size-8 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <div className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </Card>
  );
}

export function AiInfrastructureSummaryCards() {
  const { connectedProviders, availableModels, requestsToday, costToday } =
    AI_INFRA_SUMMARY;

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="AI 基础设施概览"
    >
      <SummaryCard
        label="已接入供应商"
        value={connectedProviders}
        icon={<Server className="size-4" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="可用模型"
        value={availableModels}
        icon={<Box className="size-4" aria-hidden />}
        iconClassName="bg-sky-500/10 text-sky-600"
      />
      <SummaryCard
        label="今日请求"
        value={requestsToday.toLocaleString("zh-CN")}
        icon={<Cpu className="size-4" aria-hidden />}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />
      <SummaryCard
        label="今日成本"
        value={`¥${costToday.toFixed(1)}`}
        icon={<Coins className="size-4" aria-hidden />}
        iconClassName="bg-amber-500/10 text-amber-700"
      />
    </section>
  );
}
