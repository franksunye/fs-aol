export type SkillStatus = "enabled" | "draft" | "disabled";

export type SkillBusinessLine = "Revenue" | "Operations";

export type SkillBusinessObject = {
  type: string;
  sourceSystemId: string;
};

export type TriggerDefinition = string;
export type ContextSpec = string;
export type PromptPackRef = string;
export type ToolBinding = string;
export type SchemaRef = string;
export type ApprovalPolicyRef = string;
export type ExecutionPolicyRef = string;
export type AdapterRef = string;
export type EvalSpecRef = string;

export type SkillDefinition = {
  id: string;
  label: string;
  productName: string;
  status: SkillStatus;
  businessLine: SkillBusinessLine;
  businessObject: SkillBusinessObject;
  triggers: TriggerDefinition[];
  contextSpec: ContextSpec;
  promptPack: PromptPackRef;
  tools: ToolBinding[];
  outputSchema: SchemaRef;
  approvalPolicy: ApprovalPolicyRef;
  executionPolicy: ExecutionPolicyRef;
  adapters: {
    workItem: AdapterRef;
    run?: AdapterRef;
    listBadges?: AdapterRef;
  };
  evalSpec?: EvalSpecRef;
  ui: {
    responsibleStage: string;
    supportedSystems: string;
    settingsPath?: string;
    modelStrategyPath?: string;
  };
};

export type SkillOption = {
  id: string;
  label: string;
};
