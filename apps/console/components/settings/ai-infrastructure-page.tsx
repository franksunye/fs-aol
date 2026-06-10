"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Cpu, FileText, Plus } from "lucide-react";
import { SETTINGS_HOME_PATH } from "@/lib/settings-nav";
import { MOCK_LLM_PROVIDERS } from "@/lib/ai-infrastructure-mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AiInfrastructureSummaryCards } from "./ai-infrastructure-summary-cards";
import { ProviderListPanel } from "./provider-list-panel";
import { ProviderDetailPanel } from "./provider-detail-panel";
import { ProviderInsightPanel } from "./provider-insight-panel";

export function AiInfrastructurePage() {
  const sp = useSearchParams();
  const [selectedId, setSelectedId] = useState("openai");

  useEffect(() => {
    const fromQuery = sp.get("provider")?.trim();
    if (
      fromQuery &&
      MOCK_LLM_PROVIDERS.some((provider) => provider.id === fromQuery)
    ) {
      setSelectedId(fromQuery);
    }
  }, [sp]);

  const selectedProvider = useMemo(
    () =>
      MOCK_LLM_PROVIDERS.find((provider) => provider.id === selectedId) ??
      MOCK_LLM_PROVIDERS[0],
    [selectedId]
  );

  return (
    <main
      className={cn(
        "shell-scroll min-h-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 [scrollbar-gutter:stable] lg:px-8"
      )}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-6 space-y-4">
          <nav
            className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
            aria-label="面包屑"
          >
            <Link href={SETTINGS_HOME_PATH} className="hover:text-foreground">
              设置
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-foreground font-medium">AI 基础设施</span>
          </nav>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                  <Cpu className="size-4" aria-hidden />
                </span>
                <h1 className="text-xl font-semibold tracking-tight">
                  AI 基础设施
                </h1>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                统一接入、治理与监控平台使用的 LLM / 模型能力（演示数据，暂未接入真实配置）
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() =>
                  toast.message("演示数据，暂未接入", {
                    description: "新建供应商向导",
                  })
                }
              >
                <Plus className="size-4" aria-hidden />
                新建供应商
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast.message("演示数据，暂未接入", {
                    description: "查看 LLM 调用日志",
                  })
                }
              >
                <FileText className="size-4" aria-hidden />
                查看日志
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <AiInfrastructureSummaryCards />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)_minmax(0,15rem)] xl:items-start">
            <div className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-12rem)]">
              <ProviderListPanel
                providers={MOCK_LLM_PROVIDERS}
                selectedId={selectedProvider.id}
                onSelect={setSelectedId}
              />
            </div>
            <ProviderDetailPanel provider={selectedProvider} />
            <ProviderInsightPanel provider={selectedProvider} />
          </div>
        </div>
      </div>
    </main>
  );
}
