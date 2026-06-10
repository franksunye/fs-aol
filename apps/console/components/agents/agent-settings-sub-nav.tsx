"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FOLLOW_UP_MODEL_STRATEGY_PATH,
  FOLLOW_UP_SETTINGS_PATH,
} from "@/lib/agents-nav";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "业务配置", href: FOLLOW_UP_SETTINGS_PATH },
  { id: "models", label: "模型策略", href: FOLLOW_UP_MODEL_STRATEGY_PATH },
] as const;

export function AgentSettingsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-border"
      aria-label="Follow-up Agent 设置分区"
    >
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
