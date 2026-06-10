"use client";

import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGovernanceMockData } from "@/lib/governance-mock";
import { Button } from "@/components/ui/button";
import { GovernanceSummaryCards } from "./governance-summary-cards";
import { RolesPermissionsSection } from "./roles-permissions-section";
import { ApprovalMatrixSection } from "./approval-matrix-section";
import { AccessBoundariesSection } from "./access-boundaries-section";
import { ReleaseGovernanceSection } from "./release-governance-section";
import { GovernanceSidebar } from "./governance-sidebar";

export function GovernancePage({ hkFilter }: { hkFilter?: string }) {
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
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                管理权限、审批矩阵、访问边界、发布与审计规则（演示数据，暂未接入真实配置）
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast.message("演示数据，暂未接入", {
                    description: "治理配置草稿已保存",
                  })
                }
              >
                保存草稿
              </Button>
              <Button
                type="button"
                onClick={() =>
                  toast.message("演示数据，暂未接入", {
                    description: "发布治理配置",
                  })
                }
              >
                发布配置
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <GovernanceSummaryCards summary={data.summary} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,17.5rem)] xl:items-start">
            <div className="space-y-6">
              <RolesPermissionsSection roles={data.roles} hk={hkFilter} />
              <ApprovalMatrixSection rules={data.approvalMatrix} />
              <AccessBoundariesSection
                dataPolicies={data.dataPolicies}
                modelPolicies={data.modelPolicies}
              />
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
