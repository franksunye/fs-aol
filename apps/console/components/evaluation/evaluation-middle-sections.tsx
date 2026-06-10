"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Calculator, Coins, FileSearch, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EvaluationComparison } from "./evaluation-comparison";
import {
  evaluationProblemCaseHref,
  type EvaluationAgentRow,
  type EvaluationModuleInsight,
  type EvaluationModuleKey,
  type EvaluationProblemCase,
  type EvaluationRoleInsight,
  type EvaluationRuleRow,
  type EvaluationVersionRow,
} from "@/lib/evaluation-mock";

const MODULE_ICONS: Record<EvaluationModuleKey, LucideIcon> = {
  pending_sign: Sparkles,
  quote_mgmt: Calculator,
  inspection_wo: FileSearch,
  collection: Coins,
};

const MODULE_ICON_CLASS: Record<EvaluationModuleKey, string> = {
  pending_sign: "bg-primary/10 text-primary",
  quote_mgmt: "bg-sky-100 text-sky-700",
  inspection_wo: "bg-amber-100 text-amber-700",
  collection: "bg-emerald-100 text-emerald-700",
};

export function EvaluationProblemCases({
  cases,
  hk,
}: {
  cases: EvaluationProblemCase[];
  hk?: string;
}) {
  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold">失败案例 Top 5</h2>
      <p className="text-muted-foreground mb-4 text-xs">高频失败模式，可跳转排查</p>
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
}: {
  roles: EvaluationRoleInsight[];
  modules: EvaluationModuleInsight[];
  hk?: string;
}) {
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
              const Icon = MODULE_ICONS[mod.key];
              return (
                <div
                  key={mod.label}
                  className="border-border/80 rounded-lg border bg-muted/30 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        MODULE_ICON_CLASS[mod.key]
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
  versions,
  rules,
  problemCases,
  roles,
  modules,
  hk,
}: {
  agents: EvaluationAgentRow[];
  versions: EvaluationVersionRow[];
  rules: EvaluationRuleRow[];
  problemCases: EvaluationProblemCase[];
  roles: EvaluationRoleInsight[];
  modules: EvaluationModuleInsight[];
  hk?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <EvaluationComparison
        agents={agents}
        versions={versions}
        rules={rules}
        hk={hk}
      />
      <EvaluationProblemCases cases={problemCases} hk={hk} />
      <EvaluationDimensionInsights roles={roles} modules={modules} hk={hk} />
    </div>
  );
}
