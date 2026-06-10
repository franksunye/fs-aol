"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  RefreshCw,
  Settings,
  Shield,
} from "lucide-react";
import type { MockIntegration } from "@/lib/integrations-mock";
import {
  INTEGRATION_STATUS_LABEL,
  integrationStatusClass,
  mappingStatusClass,
} from "@/lib/integrations-mock";
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

export function IntegrationDetailPanel({
  integration,
}: {
  integration: MockIntegration;
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
                  integration.brandClassName
                )}
              >
                {integration.shortLabel}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-foreground text-xl font-semibold tracking-tight">
                    {integration.name}
                  </h2>
                  <Badge className={integrationStatusClass(integration.status)}>
                    {INTEGRATION_STATUS_LABEL[integration.status]}
                  </Badge>
                  <Badge variant="outline">{integration.environment}</Badge>
                  <Badge variant="secondary">{integration.version}</Badge>
                </div>
                <dl className="text-muted-foreground mt-3 grid gap-1 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="inline">授权状态 </dt>
                    <dd className="text-foreground inline font-medium">
                      {integration.authStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">最近同步 </dt>
                    <dd className="text-foreground inline font-medium">
                      {integration.lastSync}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">同步频率 </dt>
                    <dd className="text-foreground inline font-medium">
                      {integration.syncFrequency}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">数据方向 </dt>
                    <dd className="text-foreground inline font-medium">
                      {integration.dataDirection}
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
                  toast.success("同步测试完成（演示）", {
                    description:
                      integration.status === "abnormal"
                        ? `${integration.name} 同步异常`
                        : `${integration.name} 同步正常`,
                  })
                }
              >
                <RefreshCw className="size-3.5" aria-hidden />
                同步测试
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
                    description: "更多集成操作",
                  })
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {integration.supportedObjects.length > 0 ? (
        <SettingsSectionCard title="支持对象">
          <div className="grid gap-2 sm:grid-cols-2">
            {integration.supportedObjects.map((obj) => (
              <div
                key={obj.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <span className="text-sm font-medium">{obj.name}</span>
                <span className="text-muted-foreground text-xs">{obj.sync}</span>
              </div>
            ))}
          </div>
        </SettingsSectionCard>
      ) : null}

      {integration.mappings.length > 0 ? (
        <SettingsSectionCard title="对象映射">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>外部对象</TableHead>
                <TableHead>内部对象</TableHead>
                <TableHead>字段映射</TableHead>
                <TableHead>写回</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integration.mappings.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.externalObject}
                  </TableCell>
                  <TableCell>{row.internalObject}</TableCell>
                  <TableCell className="tabular-nums">{row.mappedFields}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.writeBack}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-xs font-medium",
                      mappingStatusClass(row.status)
                    )}
                  >
                    {row.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SettingsSectionCard>
      ) : null}

      {integration.triggerEvents.length > 0 ? (
        <SettingsSectionCard title="触发事件">
          <div className="flex flex-wrap gap-2">
            {integration.triggerEvents.map((event) => (
              <Badge key={event} variant="outline">
                {event}
              </Badge>
            ))}
          </div>
        </SettingsSectionCard>
      ) : null}

      <SettingsSectionCard title="权限与写回">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              只读权限
            </p>
            <div className="flex flex-wrap gap-1.5">
              {integration.permissions.readOnly.length > 0 ? (
                integration.permissions.readOnly.map((item) => (
                  <span
                    key={item}
                    className="bg-muted text-foreground rounded-md px-2 py-1 text-xs"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              允许写回
            </p>
            <div className="flex flex-wrap gap-1.5">
              {integration.permissions.writable.length > 0 ? (
                integration.permissions.writable.map((item) => (
                  <span
                    key={item}
                    className="bg-primary/5 text-foreground rounded-md border border-primary/15 px-2 py-1 text-xs"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </div>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
