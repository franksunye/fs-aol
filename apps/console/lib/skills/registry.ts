import { SKILL_DEFINITIONS } from "./definitions";
import type { SkillDefinition, SkillOption, SkillStatus } from "./types";

const SKILLS_BY_ID = new Map<string, SkillDefinition>(
  SKILL_DEFINITIONS.map((skill) => [skill.id, skill])
);

export function listSkills(options?: {
  statuses?: readonly SkillStatus[];
}): SkillDefinition[] {
  const statuses = options?.statuses;
  return SKILL_DEFINITIONS.filter((skill) =>
    statuses?.length ? statuses.includes(skill.status) : true
  );
}

export function getSkillDefinition(skillId: string): SkillDefinition | null {
  return SKILLS_BY_ID.get(skillId) ?? null;
}

export function requireSkillDefinition(skillId: string): SkillDefinition {
  const skill = getSkillDefinition(skillId);
  if (!skill) {
    throw new Error(`Unknown skill: ${skillId}`);
  }
  return skill;
}

export function skillSourceAgent(skillId: string): SkillOption {
  const skill = requireSkillDefinition(skillId);
  return { id: skill.id, label: skill.productName };
}

export function listSkillOptions(options?: {
  statuses?: readonly SkillStatus[];
  includeAll?: boolean;
  allLabel?: string;
}): SkillOption[] {
  const skillOptions = listSkills({ statuses: options?.statuses }).map(
    (skill) => ({
      id: skill.id,
      label: skill.productName,
    })
  );

  if (!options?.includeAll) return skillOptions;

  return [
    {
      id: "all",
      label: options.allLabel ?? "全部 Agent",
    },
    ...skillOptions,
  ];
}

export const skillRegistry = {
  list: listSkills,
  get: getSkillDefinition,
  require: requireSkillDefinition,
  sourceAgent: skillSourceAgent,
  options: listSkillOptions,
} as const;
