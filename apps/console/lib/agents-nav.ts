import { FOLLOW_UP_SKILL, getSkillDefinition } from "./skills";

export const FOLLOW_UP_AGENT_ID = FOLLOW_UP_SKILL.id;

export const AGENTS_HOME_PATH = "/agents";
export const FOLLOW_UP_SETTINGS_PATH =
  FOLLOW_UP_SKILL.ui.settingsPath ?? "/agents/follow-up/settings";
export const FOLLOW_UP_MODEL_STRATEGY_PATH =
  FOLLOW_UP_SKILL.ui.modelStrategyPath ?? "/agents/follow-up/settings/models";

export type FollowUpSettingsSection = "general" | "models";

export function agentDetailHref(agentId: string): string {
  return `${AGENTS_HOME_PATH}?agent=${encodeURIComponent(agentId)}`;
}

export function agentSettingsHref(agentId: string): string | null {
  return getSkillDefinition(agentId)?.ui.settingsPath ?? null;
}

export function agentModelStrategyHref(agentId: string): string | null {
  return getSkillDefinition(agentId)?.ui.modelStrategyPath ?? null;
}
