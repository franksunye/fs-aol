export const INTEGRATIONS_HOME_PATH = "/integrations";

export function integrationHref(integrationId: string): string {
  return `${INTEGRATIONS_HOME_PATH}?integration=${encodeURIComponent(integrationId)}`;
}
