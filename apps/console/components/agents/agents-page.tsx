"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, ChevronRight, Plus } from "lucide-react";
import {
  AGENT_BUSINESS_LINES,
  filterAgents,
  MOCK_AGENTS,
  type AgentBusinessLine,
} from "@/lib/agents-mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentsSummaryCards } from "./agents-summary-cards";
import { AgentsListPanel } from "./agents-list-panel";
import { AgentDetailPanel } from "./agent-detail-panel";

export function AgentsPage() {
  const [selectedId, setSelectedId] = useState("follow-up");
  const [businessLine, setBusinessLine] =
    useState<AgentBusinessLine>("all");

  const listAgents = useMemo(
    () =>
      businessLine === "all"
        ? MOCK_AGENTS
        : filterAgents(MOCK_AGENTS, {
            tab: "all",
            businessLine,
            query: "",
          }),
    [businessLine]
  );

  useEffect(() => {
    if (!listAgents.some((agent) => agent.id === selectedId)) {
      setSelectedId(listAgents[0]?.id ?? "follow-up");
    }
  }, [listAgents, selectedId]);

  const selectedAgent = useMemo(
    () =>
      listAgents.find((a) => a.id === selectedId) ??
      MOCK_AGENTS.find((a) => a.id === selectedId) ??
      MOCK_AGENTS[0],
    [listAgents, selectedId]
  );

  return (
    <main
      className={cn(
        "shell-scroll min-h-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 [scrollbar-gutter:stable] lg:px-8"
      )}
    >
      <header className="mb-6 space-y-4">
        <nav
          className="text-muted-foreground flex items-center gap-1 text-xs"
          aria-label="面包屑"
        >
          <span>Agents</span>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-foreground font-medium">Agent 团队</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <Bot className="size-4" aria-hidden />
              </span>
              <h1 className="text-xl font-semibold tracking-tight">Agent 团队</h1>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              管理你的业务 Agents、能力边界与运行状态（演示数据，暂未接入真实配置）
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              title="演示数据，暂未接入"
              onClick={() => {}}
            >
              <Plus className="size-4" aria-hidden />
              新建 Agent
            </Button>
            <Button
              type="button"
              variant="outline"
              title="演示数据，暂未接入"
              onClick={() => {}}
            >
              导入模板
            </Button>
            <select
              className="border-input bg-background h-8 min-w-[8.5rem] rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={businessLine}
              aria-label="筛选业务线"
              onChange={(e) =>
                setBusinessLine(e.target.value as AgentBusinessLine)
              }
            >
              {AGENT_BUSINESS_LINES.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <AgentsSummaryCards />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:items-start">
          <div className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-12rem)] xl:min-h-[28rem]">
            <AgentsListPanel
              agents={listAgents}
              selectedId={selectedAgent.id}
              onSelect={setSelectedId}
            />
          </div>
          <AgentDetailPanel agent={selectedAgent} />
        </div>

        {businessLine !== "all" ? (
          <p className="text-muted-foreground text-center text-xs">
            当前业务线筛选：{businessLine} · 显示 {listAgents.length} 个 Agent
          </p>
        ) : null}
      </div>
    </main>
  );
}
