"use client";

import { useMemo } from "react";
import type { IntegrationRegistryItem } from "@/lib/adapters/integration-registry";
import { registryItemToListIntegration } from "@/lib/adapters/integration-registry";
import {
  INTEGRATION_STATUS_LABEL,
  integrationStatusClass,
  type IntegrationStatus,
  type MockIntegration,
} from "@/lib/integrations-mock";
import {
  integrationRegistryBadgeLabel,
  integrationRegistryBadgeState,
} from "./integration-registry-panels";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DataStateBadge } from "@/components/data-state-badge";

function StatusBadge({ status }: { status: IntegrationStatus }) {
  return (
    <Badge className={integrationStatusClass(status)}>
      {INTEGRATION_STATUS_LABEL[status]}
    </Badge>
  );
}

function IntegrationRow({
  integration,
  selected,
  onSelect,
  dataState,
}: {
  integration: MockIntegration;
  selected: boolean;
  onSelect: () => void;
  dataState?: IntegrationRegistryItem["dataState"];
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
            integration.brandClassName
          )}
        >
          {integration.shortLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-foreground truncate text-sm font-semibold">
              {integration.name}
            </span>
            <StatusBadge status={integration.status} />
            <DataStateBadge
              state={
                dataState
                  ? integrationRegistryBadgeState(dataState)
                  : "scenario"
              }
              label={
                dataState ? integrationRegistryBadgeLabel(dataState) : undefined
              }
              className="h-4 px-1.5 text-[10px]"
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {integration.categoryLabel} · 最近活动 {integration.lastActivity}
          </p>
        </div>
      </div>
    </button>
  );
}

export function IntegrationListPanel({
  integrations,
  registryItems,
  selectedId,
  onSelect,
}: {
  integrations?: MockIntegration[];
  registryItems?: IntegrationRegistryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const listIntegrations = useMemo(() => {
    if (registryItems?.length) {
      return registryItems.map(registryItemToListIntegration);
    }
    return integrations ?? [];
  }, [integrations, registryItems]);

  const dataStateById = useMemo(() => {
    const map = new Map<string, IntegrationRegistryItem["dataState"]>();
    registryItems?.forEach((item) => map.set(item.id, item.dataState));
    return map;
  }, [registryItems]);

  return (
    <Card className="flex h-full min-h-[24rem] flex-col gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm xl:min-h-0">
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-foreground text-sm font-semibold">集成系统</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {listIntegrations.length === 0 ? (
          <p className="text-muted-foreground px-1 py-8 text-center text-sm">
            暂无集成系统
          </p>
        ) : (
          listIntegrations.map((integration) => (
            <IntegrationRow
              key={integration.id}
              integration={integration}
              selected={integration.id === selectedId}
              onSelect={() => onSelect(integration.id)}
              dataState={dataStateById.get(integration.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
}
