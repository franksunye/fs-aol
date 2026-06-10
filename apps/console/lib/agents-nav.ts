export const FOLLOW_UP_AGENT_ID = "follow-up";

export const AGENTS_HOME_PATH = "/agents";
export const FOLLOW_UP_SETTINGS_PATH = "/agents/follow-up/settings";

export function agentDetailHref(agentId: string): string {
  return `${AGENTS_HOME_PATH}?agent=${encodeURIComponent(agentId)}`;
}

export function agentSettingsHref(agentId: string): string | null {
  if (agentId === FOLLOW_UP_AGENT_ID) return FOLLOW_UP_SETTINGS_PATH;
  return null;
}
