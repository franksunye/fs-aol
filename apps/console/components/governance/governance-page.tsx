"use client";

import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGovernanceMockData } from "@/lib/governance-mock";
import { Button } from "@/components/ui/button";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";
import { GovernanceSummaryCards } from "./governance-summary-cards";
import { RolesPermissionsSection } from "./roles-permissions-section";
import { ActionPermissionsSection } from "./action-permissions-section";
import { ApprovalMatrixSection } from "./approval-matrix-section";
import { AccessBoundariesSection } from "./access-boundaries-section";
import { SensitiveFieldMaskingSection } from "./sensitive-field-masking-section";
import { ReleaseGovernanceSection } from "./release-governance-section";
import { GovernanceSidebar } from "./governance-sidebar";
import { FollowUpRulesCard } from "./follow-up-rules-card";
import { FollowUpAuditFeed } from "./follow-up-audit-feed";
import type { GovernanceAuditRow } from "@/lib/governance-audit";
import type { GovernanceLiveSummary } from "@/lib/governance-live-summary";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/store";
import { Card } from "@/components/ui/card";

export function GovernancePage({
  hkFilter,
  auditRows = [],
  liveSummary,
  runtimeConfig = null,
}: {
  hkFilter?: string;
  auditRows?: GovernanceAuditRow[];
  liveSummary?: GovernanceLiveSummary;
  runtimeConfig?: RuntimeConfigPublic | null;
}) {
  const data = getGovernanceMockData();

  return (
    <main
      className={cn(
        "shell-scroll min-h-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 [scrollbar-gutter:stable] lg:px-8"
      )}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                  <ShieldCheck className="size-4" aria-hidden />
                </span>
                <h1 className="text-xl font-semibold tracking-tight">
                  Governance 治理
                </h1>
              </div>
              <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
                企业级治理：角色权限、动作执行、Agent 数据范围、人在回路审批、敏感字段脱敏、配置发布、审计与成本限额。
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DataStateBadge state="live" label="Follow-up 审批真实" />
                <DataStateBadge state="scenario" label="企业治理样例" />
                <DataStateBadge state="not_connected" label="发布未接入" />
              </div>
              <DataStateNote className="mt-2 max-w-3xl">
                当前真实边界是 Follow-up 的人在回路审批与追踪记录；多角色矩阵、预算、脱敏和发布流用于展示企业版控制面。
              </DataStateNote>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast.message("治理草稿暂未接入真实发布", {
                    description: "治理配置草稿暂未接入真实发布",
                  })
                }
              >
                保存草稿
              </Button>
              <Button
                type="button"
                onClick={() =>
                  toast.message("生产发布暂未接入真实写路径", {
                    description: "生产发布暂未接入真实写路径",
                  })
                }
              >
                发布配置
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <FollowUpRulesCard
            eventStatuses={runtimeConfig?.config.fsm_event_statuses}
            maxAgeDays={runtimeConfig?.config.fsm_max_age_days}
            pilots={runtimeConfig?.config.pilot_housekeepers}
          />
          <FollowUpAuditFeed rows={auditRows} />
          {liveSummary ? (
            <Card className="border-border gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Follow-up 真实计数</span>
                <DataStateBadge state="live" />
              </div>
              <p className="text-muted-foreground text-xs">
                待审核 {liveSummary.activeInbox} · 已闭环 {liveSummary.closedInbox}{" "}
                · 审批记录 {liveSummary.outcomeCount}
              </p>
            </Card>
          ) : null}
          <details className="rounded-xl border border-dashed p-4">
            <summary className="cursor-pointer text-sm font-medium">
              企业治理样例（mock summary）
            </summary>
            <div className="mt-4">
              <GovernanceSummaryCards summary={data.summary} />
            </div>
          </details>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,17.5rem)] xl:items-start">
            <div className="space-y-6">
              <RolesPermissionsSection roles={data.roles} hk={hkFilter} />
              <ActionPermissionsSection policies={data.actionPermissions} />
              <ApprovalMatrixSection rules={data.approvalMatrix} />
              <AccessBoundariesSection
                dataPolicies={data.dataPolicies}
                modelPolicies={data.modelPolicies}
              />
              <SensitiveFieldMaskingSection policies={data.sensitiveFields} />
              <ReleaseGovernanceSection
                environments={data.releaseEnvironments}
              />
            </div>

            <GovernanceSidebar
              auditLogs={data.auditLogs}
              riskAlerts={data.riskAlerts}
              summary={data.summary}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
