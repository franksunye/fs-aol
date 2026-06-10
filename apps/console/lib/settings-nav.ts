export const SETTINGS_HOME_PATH = "/settings";
export const AI_INFRASTRUCTURE_PATH = "/settings/ai";

export function aiProviderHref(providerId: string): string {
  return `${AI_INFRASTRUCTURE_PATH}?provider=${encodeURIComponent(providerId)}`;
}
