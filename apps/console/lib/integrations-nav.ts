export const INTEGRATIONS_HOME_PATH = "/integrations";

/** Live FSM integration (binding xlink-fsm). */
export const FSM_INTEGRATION_ID = "xlink-fsm";

export function integrationHref(
  integrationId: string,
  tab?: "connection" | "ingestion" | "protocol" | "health"
): string {
  const params = new URLSearchParams();
  params.set("integration", integrationId);
  if (tab) params.set("tab", tab);
  return `${INTEGRATIONS_HOME_PATH}?${params.toString()}`;
}
