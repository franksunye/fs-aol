import type { DataListColumnPreference } from "./use-data-list-column-preferences";

export const DATA_LIST_TABLE_IDS = {
  actionReview: "action-review",
  actionExecution: "action-execution",
  runs: "runs",
  evaluationSamples: "evaluation-samples",
} as const;

export const ACTION_REVIEW_COLUMN_PREFS: DataListColumnPreference[] = [
  { id: "priority", label: "级", defaultVisible: true },
  { id: "title", label: "Action 标题", defaultVisible: true },
  { id: "sourceAgent", label: "来源 Agent", defaultVisible: true },
  { id: "related", label: "关联对象", defaultVisible: true },
  { id: "sourceSystem", label: "来源系统", defaultVisible: true },
  { id: "executor", label: "执行人", defaultVisible: true },
  { id: "status", label: "状态", defaultVisible: true },
  { id: "time", label: "时间", defaultVisible: true },
];

export const ACTION_EXECUTION_COLUMN_PREFS: DataListColumnPreference[] = [
  { id: "priority", label: "级", defaultVisible: true },
  { id: "title", label: "Action 标题", defaultVisible: true },
  { id: "sourceAgent", label: "来源 Agent", defaultVisible: true },
  { id: "related", label: "关联对象", defaultVisible: true },
  { id: "sourceSystem", label: "来源系统", defaultVisible: true },
  { id: "executor", label: "执行人", defaultVisible: true },
  { id: "due", label: "截止时间", defaultVisible: true },
  { id: "status", label: "状态", defaultVisible: true },
  { id: "terminalFeedback", label: "终端反馈", defaultVisible: true },
];

export const RUNS_COLUMN_PREFS: DataListColumnPreference[] = [
  { id: "agent", label: "Agent", defaultVisible: true },
  { id: "trigger", label: "触发来源", defaultVisible: true },
  { id: "started", label: "开始时间", defaultVisible: true },
  { id: "status", label: "运行状态", defaultVisible: true },
  { id: "duration", label: "耗时", defaultVisible: true },
  { id: "cost", label: "模型成本", defaultVisible: true },
  { id: "action", label: "是否生成 Action", defaultVisible: true },
  { id: "errors", label: "错误与重试", defaultVisible: true },
];

export const EVALUATION_SAMPLES_COLUMN_PREFS: DataListColumnPreference[] = [
  { id: "time", label: "时间", defaultVisible: true },
  { id: "agent", label: "Agent / Action", defaultVisible: true },
  { id: "issue", label: "问题描述", defaultVisible: true },
  { id: "suggestion", label: "建议处理", defaultVisible: true },
  { id: "severity", label: "严重度", defaultVisible: true },
  { id: "tag", label: "标签", defaultVisible: true },
];
