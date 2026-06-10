import { AGENTS_HOME_PATH } from "./agents-nav";
import { governanceActionsHref } from "./governance-nav";
import { INTEGRATIONS_HOME_PATH } from "./integrations-nav";
import { RUNS_HOME_PATH } from "./runs-nav";
import { workbenchHref } from "./workbench-nav";

export const OVERVIEW_HOME_PATH = "/overview";

export function overviewHref(hk?: string): string {
  if (!hk) return OVERVIEW_HOME_PATH;
  return `${OVERVIEW_HOME_PATH}?hk=${encodeURIComponent(hk)}`;
}

export function overviewPendingReviewHref(hk?: string): string {
  return workbenchHref({ hk, from: "active" });
}

export function overviewActionsHref(hk?: string): string {
  return governanceActionsHref(hk);
}

export function overviewAnomalyHref(hk?: string): string {
  const q = new URLSearchParams();
  q.set("rquick", "anomaly");
  if (hk) q.set("hk", hk);
  return `${RUNS_HOME_PATH}?${q.toString()}`;
}

export function overviewAgentsHref(): string {
  return AGENTS_HOME_PATH;
}

export function overviewIntegrationsHref(): string {
  return INTEGRATIONS_HOME_PATH;
}
