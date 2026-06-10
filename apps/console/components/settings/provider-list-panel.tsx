"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import {
  filterProviders,
  PROVIDER_FILTER_TABS,
  PROVIDER_STATUS_LABEL,
  type MockLlmProvider,
  type ProviderConnectionStatus,
  type ProviderFilterTab,
} from "@/lib/ai-infrastructure-mock";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function ProviderStatusBadge({
  status,
}: {
  status: ProviderConnectionStatus;
}) {
  if (status === "connected") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
        {PROVIDER_STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "abnormal") {
    return (
      <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/10">
        {PROVIDER_STATUS_LABEL[status]}
      </Badge>
    );
  }
  return <Badge variant="secondary">{PROVIDER_STATUS_LABEL[status]}</Badge>;
}

function ProviderRow({
  provider,
  selected,
  onSelect,
}: {
  provider: MockLlmProvider;
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
            provider.brandClassName
          )}
        >
          {provider.shortLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-foreground truncate text-sm font-semibold">
              {provider.name}
            </span>
            <ProviderStatusBadge status={provider.status} />
            <Badge variant="outline">{provider.environment}</Badge>
            <DataStateBadge state="scenario" className="h-4 px-1.5 text-[10px]" />
          </div>
          <p className="text-muted-foreground mt-1.5 text-xs">
            上次同步 · {provider.lastSync}
          </p>
        </div>
      </div>
    </button>
  );
}

export function ProviderListPanel({
  providers,
  selectedId,
  onSelect,
}: {
  providers: MockLlmProvider[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [filterTab, setFilterTab] = useState<ProviderFilterTab>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => filterProviders(providers, { tab: filterTab, query }),
    [providers, filterTab, query]
  );

  return (
    <Card className="flex h-full min-h-[24rem] flex-col gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm xl:min-h-0">
      <div className="space-y-3 border-b border-border px-4 py-4">
        <h2 className="text-foreground text-sm font-semibold">供应商</h2>
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as ProviderFilterTab)}
        >
          <TabsList className="h-8 w-full">
            {PROVIDER_FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 text-xs">
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
              placeholder="搜索供应商"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
              aria-label="搜索供应商"
            />
          </div>
          <button
            type="button"
            title="供应商筛选暂未接入真实配置"
            className="border-input text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
            aria-label="筛选"
          >
            <Filter className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-1 py-8 text-center text-sm">
            没有匹配的供应商
          </p>
        ) : (
          visible.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              selected={provider.id === selectedId}
              onSelect={() => onSelect(provider.id)}
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
