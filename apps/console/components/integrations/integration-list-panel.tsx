"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import {
  filterIntegrations,
  INTEGRATION_FILTER_TABS,
  INTEGRATION_SORT_OPTIONS,
  INTEGRATION_STATUS_LABEL,
  integrationStatusClass,
  sortIntegrations,
  type IntegrationFilterTab,
  type IntegrationSortKey,
  type IntegrationStatus,
  type MockIntegration,
} from "@/lib/integrations-mock";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
}: {
  integration: MockIntegration;
  selected: boolean;
  onSelect: () => void;
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
  selectedId,
  onSelect,
}: {
  integrations: MockIntegration[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [filterTab, setFilterTab] = useState<IntegrationFilterTab>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<IntegrationSortKey>("status");

  const visible = useMemo(() => {
    const filtered = filterIntegrations(integrations, {
      tab: filterTab,
      query,
    });
    return sortIntegrations(filtered, sortKey);
  }, [integrations, filterTab, query, sortKey]);

  return (
    <Card className="flex h-full min-h-[24rem] flex-col gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm xl:min-h-0">
      <div className="space-y-3 border-b border-border px-4 py-4">
        <h2 className="text-foreground text-sm font-semibold">集成系统</h2>
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as IntegrationFilterTab)}
        >
          <TabsList className="h-auto min-h-8 w-full flex-wrap">
            {INTEGRATION_FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 text-xs"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索系统名称"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
              aria-label="搜索集成系统"
            />
          </div>
          <select
            className="border-input bg-background h-8 w-[7.5rem] shrink-0 rounded-lg border px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={sortKey}
            aria-label="排序方式"
            onChange={(e) => setSortKey(e.target.value as IntegrationSortKey)}
          >
            {INTEGRATION_SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            title="演示数据，暂未接入"
            className="border-input text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border"
            aria-label="筛选"
          >
            <Filter className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-1 py-8 text-center text-sm">
            没有匹配的系统
          </p>
        ) : (
          visible.map((integration) => (
            <IntegrationRow
              key={integration.id}
              integration={integration}
              selected={integration.id === selectedId}
              onSelect={() => onSelect(integration.id)}
            />
          ))
        )}
      </div>

      <div className="text-muted-foreground flex items-center justify-between border-t border-border px-4 py-2.5 text-xs">
        <span>共 {visible.length} 项</span>
        <span className="tabular-nums">20 条/页</span>
      </div>
    </Card>
  );
}
