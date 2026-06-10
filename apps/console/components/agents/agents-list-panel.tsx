"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  AGENT_FILTER_TABS,
  AGENT_SORT_OPTIONS,
  AGENT_STATUS_LABEL,
  filterAgents,
  sortAgents,
  type AgentFilterTab,
  type AgentSortKey,
  type MockAgent,
} from "@/lib/agents-mock";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: MockAgent["status"] }) {
  if (status === "enabled") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
        {AGENT_STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "draft") {
    return <Badge variant="secondary">{AGENT_STATUS_LABEL[status]}</Badge>;
  }
  return <Badge variant="outline">{AGENT_STATUS_LABEL[status]}</Badge>;
}

function AgentListRow({
  agent,
  selected,
  onSelect,
}: {
  agent: MockAgent;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = agent.icon;

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
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            agent.iconClassName
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-foreground truncate text-sm font-semibold">
              {agent.name}
            </span>
            <StatusBadge status={agent.status} />
            <Badge variant="outline">{agent.businessLine}</Badge>
            {agent.beta ? (
              <Badge variant="secondary" className="text-[10px]">
                Beta
              </Badge>
            ) : null}
          </div>
          <dl className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div>
              <dt className="inline">负责阶段 </dt>
              <dd className="text-foreground inline font-medium">
                {agent.responsibleStage}
              </dd>
            </div>
            <div>
              <dt className="inline">接入系统 </dt>
              <dd className="text-foreground inline font-medium">
                {agent.supportedSystems}
              </dd>
            </div>
            <div>
              <dt className="inline">今日运行 </dt>
              <dd className="text-foreground inline font-medium tabular-nums">
                {agent.runsToday}
              </dd>
            </div>
            <div>
              <dt className="inline">采纳率 </dt>
              <dd className="text-foreground inline font-medium tabular-nums">
                {agent.adoptionRate}%
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </button>
  );
}

export function AgentsListPanel({
  agents,
  selectedId,
  onSelect,
}: {
  agents: MockAgent[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [filterTab, setFilterTab] = useState<AgentFilterTab>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<AgentSortKey>("runsToday");

  const visible = useMemo(() => {
    const filtered = filterAgents(agents, {
      tab: filterTab,
      businessLine: "all",
      query,
    });
    return sortAgents(filtered, sortKey);
  }, [agents, filterTab, query, sortKey]);

  return (
    <Card className="flex h-full min-h-[24rem] flex-col gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm xl:min-h-0">
      <div className="space-y-3 border-b border-border px-4 py-4">
        <h2 className="text-foreground text-sm font-semibold">全部 Agents</h2>
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as AgentFilterTab)}
        >
          <TabsList className="h-8 w-full">
            {AGENT_FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 Agent 名称"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
              aria-label="搜索 Agent"
            />
          </div>
          <select
            className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-[9.5rem]"
            value={sortKey}
            aria-label="排序方式"
            onChange={(e) => setSortKey(e.target.value as AgentSortKey)}
          >
            {AGENT_SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-1 py-8 text-center text-sm">
            没有匹配的 Agent
          </p>
        ) : (
          visible.map((agent) => (
            <AgentListRow
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedId}
              onSelect={() => onSelect(agent.id)}
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
