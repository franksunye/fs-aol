"use client";

import { useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Calculator, Coins, FileSearch, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  evaluationAgentVersionHref,
  evaluationAgentsHref,
  evaluationRuleHref,
  formatEvaluationYuan,
  type EvaluationAgentRow,
  type EvaluationRuleRow,
  type EvaluationVersionRow,
} from "@/lib/evaluation-mock";

type ComparisonTab = "agents" | "versions" | "rules";

const AGENT_ICONS: Record<EvaluationAgentRow["id"], LucideIcon> = {
  "follow-up": Sparkles,
  estimate: Calculator,
  inspection: FileSearch,
  collection: Coins,
};

const AGENT_ICON_CLASS: Record<EvaluationAgentRow["id"], string> = {
  "follow-up": "bg-primary/10 text-primary",
  estimate: "bg-sky-100 text-sky-700",
  inspection: "bg-amber-100 text-amber-700",
  collection: "bg-emerald-100 text-emerald-700",
};

const TABS: { id: ComparisonTab; label: string }[] = [
  { id: "agents", label: "Agent" },
  { id: "versions", label: "版本" },
  { id: "rules", label: "规则" },
];

export function EvaluationComparison({
  agents,
  versions,
  rules,
  hk,
}: {
  agents: EvaluationAgentRow[];
  versions: EvaluationVersionRow[];
  rules: EvaluationRuleRow[];
  hk?: string;
}) {
  const [tab, setTab] = useState<ComparisonTab>("agents");

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Agent / 版本 / 规则对比</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            横向比较效果指标，定位退化版本与高风险规则
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                tab === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {tab === "agents" ? (
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 text-right font-medium">建议数</th>
                <th className="pb-2 text-right font-medium">准确率</th>
                <th className="pb-2 text-right font-medium">采纳率</th>
                <th className="pb-2 text-right font-medium">修改率</th>
                <th className="pb-2 text-right font-medium">误报率</th>
                <th className="pb-2 text-right font-medium">完成率</th>
                <th className="pb-2 text-right font-medium">转化增量</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const Icon = AGENT_ICONS[agent.id];
                return (
                  <tr key={agent.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5">
                      <Link
                        href={evaluationAgentsHref(agent.id, hk)}
                        className="hover:text-primary flex items-center gap-2 font-medium"
                      >
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-lg",
                            AGENT_ICON_CLASS[agent.id]
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        {agent.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{agent.suggestions}</td>
                    <td className="py-2.5 text-right tabular-nums">{agent.accuracyRate}%</td>
                    <td className="py-2.5 text-right tabular-nums">{agent.adoptionRate}%</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {agent.modificationRate}%
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {agent.falsePositiveRate}%
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {agent.completionRate}%
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatEvaluationYuan(agent.businessValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}

        {tab === "versions" ? (
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Agent / 版本</th>
                <th className="pb-2 text-right font-medium">上线</th>
                <th className="pb-2 text-right font-medium">建议数</th>
                <th className="pb-2 text-right font-medium">准确率</th>
                <th className="pb-2 text-right font-medium">采纳率</th>
                <th className="pb-2 text-right font-medium">误报率</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5">
                    <Link
                      href={evaluationAgentVersionHref(row.id, hk)}
                      className="hover:text-primary font-medium"
                    >
                      {row.agentName}
                      <span className="text-muted-foreground font-normal"> · {row.version}</span>
                    </Link>
                  </td>
                  <td className="text-muted-foreground py-2.5 text-right tabular-nums">
                    {row.deployedAt}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{row.suggestions}</td>
                  <td className="py-2.5 text-right tabular-nums">{row.accuracyRate}%</td>
                  <td className="py-2.5 text-right tabular-nums">{row.adoptionRate}%</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {row.falsePositiveRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {tab === "rules" ? (
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">规则</th>
                <th className="pb-2 font-medium">所属 Agent</th>
                <th className="pb-2 text-right font-medium">触发</th>
                <th className="pb-2 text-right font-medium">准确率</th>
                <th className="pb-2 text-right font-medium">误报率</th>
                <th className="pb-2 text-right font-medium">采纳率</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5">
                    <Link
                      href={evaluationRuleHref(row.id, hk)}
                      className="hover:text-primary font-medium"
                    >
                      {row.ruleName}
                    </Link>
                  </td>
                  <td className="text-muted-foreground py-2.5">{row.agentName}</td>
                  <td className="py-2.5 text-right tabular-nums">{row.triggerCount}</td>
                  <td className="py-2.5 text-right tabular-nums">{row.accuracyRate}%</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {row.falsePositiveRate}%
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{row.adoptionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        <Link href={evaluationAgentsHref(undefined, hk)} className="hover:text-primary">
          管理 Agent 与规则配置 →
        </Link>
      </p>
    </Card>
  );
}
