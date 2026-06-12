/**
 * Operator Platform 读模型 — UI / L1 应逐步只依赖此文件中的类型。
 * 楔子字段沉入 metadata / recommendation.raw，见 lib/adapters/*。
 */

import type { ActionListDisplay } from "./action-list-display";
import { FOLLOW_UP_SKILL_ID } from "./skills";

export const SKILL_FOLLOW_UP = FOLLOW_UP_SKILL_ID;

export type SkillId = typeof SKILL_FOLLOW_UP | (string & {});

export type InboxState = "active" | "execution" | "closed" | "archived";

export type WorkItemPriority = "high" | "medium" | "low";

export type DispositionDecision =
  | "approved"
  | "rejected"
  | "modified"
  | "followed_up";

export type StatusBadge = {
  key: string;
  label: string;
};

export type Recommendation = {
  headline: string;
  rationale: string;
  primaryAction: string;
  talkingPoints: string[];
  citations: string[];
  /** Action Spec 等技能载荷原样保留 */
  raw: unknown;
};

export type Disposition = {
  decision: DispositionDecision;
  note: string;
  operator: string;
  at: string;
};

/** 列表行预计算展示字段（由 skill adapter 填充，通用组件只读） */
export type WorkItemListDisplay = ActionListDisplay;

export type WorkItem = {
  id: string;
  subjectId: string;
  skillId: SkillId;
  assigneeId?: string;
  inbox: InboxState;
  priority?: WorkItemPriority;
  summary: string;
  statusBadges: StatusBadge[];
  recommendation: Recommendation;
  disposition?: Disposition;
  /** 楔子 / Connector 扩展；通用 UI 不得依赖具体键 */
  metadata: Record<string, unknown>;
  /** 由 adapter 提供的列表展示（可选） */
  listDisplay?: WorkItemListDisplay;
};

export type ActivityEvent = {
  id: string;
  lane: "business" | "agent";
  kind: string;
  at: string;
  title: string;
  summary?: string;
  payload: unknown;
};
