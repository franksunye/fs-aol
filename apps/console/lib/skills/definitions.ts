import type { SkillDefinition } from "./types";

export const FOLLOW_UP_SKILL_ID = "follow-up" as const;
export const QUOTE_REVIEW_SKILL_ID = "quote-review" as const;

export const FOLLOW_UP_SKILL: SkillDefinition = {
  id: FOLLOW_UP_SKILL_ID,
  label: "Follow-up",
  productName: "Follow-up Agent",
  status: "enabled",
  businessLine: "Revenue",
  businessObject: {
    type: "work_order",
    sourceSystemId: "xlink-fsm",
  },
  triggers: ["fsm.status_206_stale", "manual.reanalysis"],
  contextSpec: "skills/follow-up/context.v1",
  promptPack: "skills/follow-up/prompts.v1",
  tools: ["read_fsm", "read_tracking", "write_action"],
  outputSchema: "contracts/suggestion.schema.json",
  approvalPolicy: "human_approval_required",
  executionPolicy: "dry_run_or_approved_execution",
  adapters: {
    workItem: "adapters/follow-up.work-item",
    run: "adapters/follow-up.run",
    listBadges: "adapters/follow-up.list-badges",
  },
  evalSpec: "skills/follow-up/eval.v1",
  ui: {
    responsibleStage: "待签约",
    supportedSystems: "CRM · FSM · 通话",
    settingsPath: "/agents/follow-up/settings",
    modelStrategyPath: "/agents/follow-up/settings/models",
  },
};

export const QUOTE_REVIEW_SKILL: SkillDefinition = {
  id: QUOTE_REVIEW_SKILL_ID,
  label: "Quote Review",
  productName: "Quote Review Agent",
  status: "draft",
  businessLine: "Revenue",
  businessObject: {
    type: "quote",
    sourceSystemId: "xlink-fsm",
  },
  triggers: ["quote.created", "quote.updated", "manual.review"],
  contextSpec: "skills/quote-review/context.v1",
  promptPack: "skills/quote-review/prompts.v1",
  tools: ["read_fsm", "read_quote", "read_policy", "write_action"],
  outputSchema: "contracts/quote-review.schema.json",
  approvalPolicy: "human_approval_required",
  executionPolicy: "draft_action_only",
  adapters: {
    workItem: "adapters/quote-review.work-item",
  },
  evalSpec: "skills/quote-review/eval.v1",
  ui: {
    responsibleStage: "报价",
    supportedSystems: "CRM · 报价",
  },
};

export const SKILL_DEFINITIONS = [
  FOLLOW_UP_SKILL,
  QUOTE_REVIEW_SKILL,
] as const satisfies readonly SkillDefinition[];
