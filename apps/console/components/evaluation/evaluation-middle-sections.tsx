"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  evaluationAgentsHref,
  evaluationProblemCaseHref,
  formatEvaluationYuan,
  type EvaluationAgentRow,
  type EvaluationModuleInsight,
  type EvaluationProblemCase,
  type EvaluationRoleInsight,
} from "@/lib/evaluation-mock";

export function EvaluationAgentTable({
  agents,
  hk,
}: {
  agents: EvaluationAgentRow[];
  hk?: string;
}) {
  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Agent 效果对比</h2>
        <Link href={evaluationAgentsHref(undefined, hk)} className="text-primary text-xs hover:underline">
          查看全部 Agents →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-2 font-medium">Agent</th>
              <th className="pb-2 text-right font-medium">建议数</th>
              <th className="pb-2 text-right font-medium">采纳率</th>
              <th className="pb-2 text-right font-medium">反馈率</th>
              <th className="pb-2 text-right font-medium">完成率</th>
              <th className="pb-2 text-right font-medium">业务价值</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const Icon = agent.icon;
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
                          agent.iconClassName
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      {agent.name}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{agent.suggestions}</td>
                  <td className="py-2.5 text-right tabular-nums">{agent.adoptionRate}%</td>
                  <td className="py-2.5 text-right tabular-nums">{agent.feedbackRate}%</td>
                  <td className="py-2.5 text-right tabular-nums">{agent.completionRate}%</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {formatEvaluationYuan(agent.businessValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function EvaluationProblemCases({
  cases,
  hk,
}: {
  cases: EvaluationProblemCase[];
  hk?: string;
}) {
  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">问题案例 Top 5</h2>
      <ol className="space-y-3">
        {cases.map((item) => (
          <li key={item.rank}>
            <Link
              href={evaluationProblemCaseHref(item, hk)}
              className="hover:bg-accent/40 -mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors"
            >
              <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums">
                {item.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-snug">{item.topic}</div>
                <div className="text-muted-foreground text-xs">{item.count} 例</div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function EvaluationDimensionInsights({
  roles,
  modules,
  hk,
}: {
  roles: EvaluationRoleInsight[];
  modules: EvaluationModuleInsight[];
  hk?: string;
}) {
  void hk;
  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">维度洞察 / 角色详情</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-muted-foreground mb-2 text-[11px] font-medium">使用最多的角色</h3>
          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role.role}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">{role.role}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {role.users} 人 · {role.deltaText}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-muted-foreground mb-2 text-[11px] font-medium">受影响最大的模块</h3>
          <div className="grid grid-cols-2 gap-2">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.label}
                  className="border-border/80 rounded-lg border bg-muted/30 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        mod.iconClassName
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{mod.label}</div>
                      <div className="text-muted-foreground text-[10px] tabular-nums">
                        {mod.value} · {mod.deltaText}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function EvaluationMiddleSections({
  agents,
  problemCases,
  roles,
  modules,
  hk,
}: {
  agents: EvaluationAgentRow[];
  problemCases: EvaluationProblemCase[];
  roles: EvaluationRoleInsight[];
  modules: EvaluationModuleInsight[];
  hk?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <EvaluationAgentTable agents={agents} hk={hk} />
      <EvaluationProblemCases cases={problemCases} hk={hk} />
      <EvaluationDimensionInsights roles={roles} modules={modules} hk={hk} />
    </div>
  );
}
