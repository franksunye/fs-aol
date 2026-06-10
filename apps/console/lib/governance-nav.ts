import { AGENTS_HOME_PATH } from "./agents-nav";
import { INTEGRATIONS_HOME_PATH } from "./integrations-nav";
import { RUNS_HOME_PATH } from "./runs-nav";
import { AI_INFRASTRUCTURE_PATH } from "./settings-nav";
import { OVERVIEW_HOME_PATH } from "./overview-nav";
import { workbenchHref } from "./workbench-nav";

export const GOVERNANCE_HOME_PATH = "/governance";

export type GovernanceModuleKey =
  | "overview"
  | "actions"
  | "runs"
  | "agents"
  | "integrations"
  | "analytics"
  | "settings";

export const GOVERNANCE_MODULE_LABELS: Record<GovernanceModuleKey, string> = {
  overview: "总览",
  actions: "Actions",
  runs: "Runs",
  agents: "Agents",
  integrations: "集成",
  analytics: "评估",
  settings: "设置",
};

export const GOVERNANCE_MODULE_ORDER: GovernanceModuleKey[] = [
  "overview",
  "actions",
  "runs",
  "agents",
  "integrations",
  "analytics",
  "settings",
];

export function governanceActionsHref(hk?: string): string {
  const q = new URLSearchParams();
  q.set("tab", "actions");
  if (hk) q.set("hk", hk);
  return `/?${q.toString()}`;
}

export function governanceModuleHref(
  module: GovernanceModuleKey,
  hk?: string
): string {
  switch (module) {
    case "overview":
      return hk
        ? `${OVERVIEW_HOME_PATH}?hk=${encodeURIComponent(hk)}`
        : OVERVIEW_HOME_PATH;
    case "actions":
      return governanceActionsHref(hk);
    case "runs":
      return hk
        ? `${RUNS_HOME_PATH}?hk=${encodeURIComponent(hk)}`
        : RUNS_HOME_PATH;
    case "agents":
      return AGENTS_HOME_PATH;
    case "integrations":
      return INTEGRATIONS_HOME_PATH;
    case "analytics":
      return hk ? `/analytics?hk=${encodeURIComponent(hk)}` : "/analytics";
    case "settings":
      return AI_INFRASTRUCTURE_PATH;
  }
}
