"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { FOLLOW_UP_MODEL_STRATEGY_PATH } from "@/lib/agents-nav";
import type { MockLlmProvider } from "@/lib/ai-infrastructure-mock";
import { PROVIDER_STATUS_LABEL } from "@/lib/ai-infrastructure-mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function DemoButton({
  children,
  variant = "outline",
  size = "sm",
}: {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() =>
        toast.message("演示数据，暂未接入", {
          description: "该操作仅为 UI 预览",
        })
      }
    >
      {children}
    </Button>
  );
}

export function ProviderDetailPanel({
  provider,
}: {
  provider: MockLlmProvider;
}) {
  return (
    <div className="space-y-4">
      <Card className="gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <span
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                  provider.brandClassName
                )}
              >
                {provider.shortLabel}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-foreground text-xl font-semibold tracking-tight">
                    {provider.name}
                  </h2>
                  {provider.status === "connected" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                      {PROVIDER_STATUS_LABEL[provider.status]}
                    </Badge>
                  ) : provider.status === "abnormal" ? (
                    <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/10">
                      {PROVIDER_STATUS_LABEL[provider.status]}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {PROVIDER_STATUS_LABEL[provider.status]}
                    </Badge>
                  )}
                  <Badge variant="outline">{provider.environment}</Badge>
                </div>
                <dl className="text-muted-foreground mt-3 grid gap-1 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="inline">API 端点 </dt>
                    <dd className="text-foreground inline font-medium">
                      {provider.endpoint}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">区域 </dt>
                    <dd className="text-foreground inline font-medium">
                      {provider.region}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">最近检查 </dt>
                    <dd className="text-foreground inline font-medium">
                      {provider.lastCheck}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">同步状态 </dt>
                    <dd
                      className={cn(
                        "inline font-medium",
                        provider.syncTone === "good"
                          ? "text-emerald-600"
                          : provider.syncTone === "warn"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                      )}
                    >
                      {provider.syncLabel}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <DemoButton variant="outline">
                <Shield className="size-3.5" aria-hidden />
                重新授权
              </DemoButton>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success("连接测试完成（演示）", {
                    description:
                      provider.status === "abnormal"
                        ? "连接失败，已记录事件"
                        : `${provider.name} 响应正常`,
                  })
                }
              >
                <RefreshCw className="size-3.5" aria-hidden />
                连接测试
              </Button>
              <DemoButton variant="outline">
                <Settings className="size-3.5" aria-hidden />
                设置
              </DemoButton>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="更多操作"
                onClick={() =>
                  toast.message("演示数据，暂未接入", {
                    description: "更多供应商操作",
                  })
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsSectionCard title="模型库">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模型名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>能力标签</TableHead>
              <TableHead>默认用途</TableHead>
              <TableHead>延迟</TableHead>
              <TableHead>成本</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {provider.models.map((model) => (
              <TableRow key={model.id}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {model.type}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-[10px]">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {model.defaultUsage}
                </TableCell>
                <TableCell className="tabular-nums">{model.latency}</TableCell>
                <TableCell className="tabular-nums">{model.cost}</TableCell>
                <TableCell>
                  {model.available ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      可用
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">不可用</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="路由与默认策略"
        action={<DemoButton size="sm">编辑策略</DemoButton>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["默认生成模型", provider.routing.defaultGeneration],
            ["默认高质量推理模型", provider.routing.defaultReasoning],
            ["默认视觉模型", provider.routing.defaultVision],
            ["失败回退模型", provider.routing.fallbackModel],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="text-foreground mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 sm:col-span-2">
            <dt className="text-muted-foreground text-xs">生产环境允许模型</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {provider.routing.productionAllowed.map((model) => (
                <Badge key={model} variant="secondary">
                  {model}
                </Badge>
              ))}
            </dd>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          平台级默认路由；Agent 级任务策略见{" "}
          <Link
            href={FOLLOW_UP_MODEL_STRATEGY_PATH}
            className="text-primary font-medium hover:underline"
          >
            Follow-up Agent 模型策略
          </Link>
        </p>
      </SettingsSectionCard>
    </div>
  );
}
