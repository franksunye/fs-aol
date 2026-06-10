import { AGENTS_HOME_PATH } from "./agents-nav";
import { governanceActionsHref } from "./governance-nav";
import { INTEGRATIONS_HOME_PATH } from "./integrations-nav";
import { RUNS_HOME_PATH } from "./runs-nav";
import { actionCenterTabHref } from "./action-center-nav";

export const OVERVIEW_HOME_PATH = "/overview";

export function overviewHref(hk?: string): string {
  if (!hk) return OVERVIEW_HOME_PATH;
  return `${OVERVIEW_HOME_PATH}?hk=${encodeURIComponent(hk)}`;
}

export function overviewPendingReviewHref(hk?: string): string {
  return actionCenterTabHref({ hk, from: "active" });
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

export function overviewAnalyticsHref(hk?: string): string {
  if (!hk) return "/analytics";
  return `/analytics?hk=${encodeURIComponent(hk)}`;
}

export function overviewRunsHref(hk?: string): string {
  const q = new URLSearchParams();
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `${RUNS_HOME_PATH}?${s}` : RUNS_HOME_PATH;
}
