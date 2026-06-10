import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileSearch,
  MessageSquare,
  Phone,
  RefreshCw,
} from "lucide-react";
import type { ActionFlowStatus } from "./action-flow-status";
import {
  addDays,
  formatDateKey,
  resolveCalendarAssigneeFromHk,
  type CalendarPriority,
} from "./calendar-mock";

export type MyActionQuickFilter =
  | "all"
  | "today"
  | "high"
  | "overdue"
  | "agent";

export type MyActionTimelineItem = {
  at: string;
  title: string;
  detail?: string;
};

export type MyAction = {
  id: string;
  title: string;
  opportunityId: string;
  sourceAgent: string;
  agentId: string;
  target: { name: string; type: string };
  dueDate: string;
  dueTime: string;
  priority: CalendarPriority;
  status: ActionFlowStatus;
  assignee: string;
  assigneeId: string;
  estimateMins: number;
  workOrderKey?: string;
  icon: LucideIcon;
  /** Action 内容摘要 */
  goal: string;
  dispatchTarget: string;
  createdAt: string;
  lastSyncedAt: string;
  terminalFeedback?: string;
  contextFacts: { label: string; value: string }[];
  timeline: MyActionTimelineItem[];
};

export type MyActionsSummary = {
  pendingDispatch: number;
  pendingDispatchDelta: number;
  dispatched: number;
  dispatchedDelta: number;
  inProgress: number;
  inProgressDelta: number;
  withFeedback: number;
  withFeedbackDelta: number;
  timeoutAnomaly: number;
  timeoutAnomalyDelta: number;
};

export const MY_ACTIONS_AGENT_OPTIONS = [
  { id: "all", label: "全部来源" },
  { id: "follow-up", label: "Follow-up Agent" },
  { id: "customer-follow", label: "客户跟进 Agent" },
  { id: "contract", label: "合同管理 Agent" },
] as const;

function action(
  partial: Omit<MyAction, "icon" | "dispatchTarget" | "createdAt" | "lastSyncedAt"> & {
    icon?: LucideIcon;
    dispatchTarget?: string;
    createdAt?: string;
    lastSyncedAt?: string;
  }
): MyAction {
  return {
    icon: Phone,
    dispatchTarget: "CRM 待办",
    createdAt: "今天 08:40",
    lastSyncedAt: "5 分钟前",
    ...partial,
  };
}

export function getMyActionsMockData(): MyAction[] {
  const today = formatDateKey(new Date());
  const tomorrow = formatDateKey(addDays(new Date(), 1));
  const yesterday = formatDateKey(addDays(new Date(), -1));
  const twoDaysAgo = formatDateKey(addDays(new Date(), -2));

  return [
    action({
      id: "ma-1",
      title: "电话回访客户，确认报价接受情况",
      opportunityId: "GD2025060764",
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      target: { name: "深圳智造科技有限公司", type: "客户" },
      dueDate: today,
      dueTime: "09:30",
      priority: "high",
      status: "dispatched",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 5,
      workOrderKey: "demo:sz-zhizao-001",
      icon: Phone,
      goal: "确认客户对 V3 报价方案的接受度，推动进入签约流程。",
      dispatchTarget: "CRM · 管家待办",
      terminalFeedback: "终端尚未回写",
      contextFacts: [
        { label: "商机金额", value: "¥ 128,000" },
        { label: "报价版本", value: "V3 · 2025-06-08" },
        { label: "关键联系人", value: "王总 · 138****2201" },
        { label: "停滞天数", value: "6 天" },
      ],
      timeline: [
        {
          at: "今天 08:40",
          title: "Agent 生成行动",
          detail: "Follow-up Agent 识别报价后 48h 无跟进",
        },
        {
          at: "昨天 17:20",
          title: "报价版本更新",
          detail: "V3 报价已推送至客户邮箱",
        },
      ],
    }),
    action({
      id: "ma-2",
      title: "合同审批跟进",
      opportunityId: "HT2025060112",
      sourceAgent: "合同管理 Agent",
      agentId: "contract",
      target: { name: "华东零售集团", type: "合同" },
      dueDate: today,
      dueTime: "10:30",
      priority: "medium",
      status: "in_progress",
      assignee: "李伟",
      assigneeId: "liwei",
      estimateMins: 8,
      icon: ClipboardCheck,
      goal: "跟进法务审批节点，确认补件清单并推动今日出结论。",
      dispatchTarget: "FSM · 合同审批",
      terminalFeedback: "法务已接单，补件清单整理中",
      lastSyncedAt: "2 分钟前",
      contextFacts: [
        { label: "合同金额", value: "¥ 560,000" },
        { label: "当前节点", value: "法务复审" },
        { label: "已耗时", value: "3 个工作日" },
      ],
      timeline: [
        { at: "今天 09:10", title: "终端开始执行" },
        { at: "昨天 15:00", title: "Action 已分发" },
      ],
    }),
    action({
      id: "ma-3",
      title: "高优客户情绪回访",
      opportunityId: "GD2025060441",
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      target: { name: "蓝鲸科技", type: "客户" },
      dueDate: today,
      dueTime: "14:00",
      priority: "high",
      status: "pending_dispatch",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 10,
      icon: MessageSquare,
      goal: "回应客户对交付进度的顾虑，恢复信任并确认下一步安排。",
      dispatchTarget: "企微 · 管家任务",
      contextFacts: [
        { label: "情绪标签", value: "转弱" },
        { label: "最近互动", value: "7 天前" },
      ],
      timeline: [{ at: "今天 07:50", title: "Agent 生成 Action，待分发" }],
    }),
    action({
      id: "ma-4",
      title: "停滞工单唤醒",
      opportunityId: "WO-88421",
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      target: { name: "光合能源", type: "商机" },
      dueDate: yesterday,
      dueTime: "10:00",
      priority: "high",
      status: "timeout",
      assignee: "陈浩",
      assigneeId: "chenhao",
      estimateMins: 6,
      icon: RefreshCw,
      goal: "重新建立联系，确认停滞原因并约定下一步推进时间。",
      dispatchTarget: "CRM · 管家待办",
      terminalFeedback: "超过 SLA，终端未回写",
      lastSyncedAt: "1 小时前",
      contextFacts: [
        { label: "停滞天数", value: "11 天" },
        { label: "报价状态", value: "已报价" },
      ],
      timeline: [
        { at: "昨天 10:00", title: "Action 已超时" },
        { at: "3 天前", title: "已分发至 CRM" },
      ],
    }),
    action({
      id: "ma-5",
      title: "客户投诉回访",
      opportunityId: "GD2025059982",
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      target: { name: "恒泰零售", type: "客户" },
      dueDate: twoDaysAgo,
      dueTime: "09:30",
      priority: "high",
      status: "no_feedback",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 12,
      workOrderKey: "demo:ht-lingshou-004",
      icon: Phone,
      goal: "回访投诉处理结果，确认客户满意度并记录闭环。",
      dispatchTarget: "CRM · 投诉工单",
      terminalFeedback: "已分发 48h，终端无反馈",
      lastSyncedAt: "30 分钟前",
      contextFacts: [
        { label: "投诉类型", value: "交付延迟" },
        { label: "处理状态", value: "已出方案" },
      ],
      timeline: [
        { at: "2 天前", title: "标记为无反馈" },
        { at: "4 天前", title: "Action 已分发" },
      ],
    }),
    action({
      id: "ma-6",
      title: "签约催办",
      opportunityId: "GD2025060888",
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      target: { name: "云帆实业", type: "合同" },
      dueDate: tomorrow,
      dueTime: "09:30",
      priority: "high",
      status: "dispatched",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 5,
      workOrderKey: "demo:yf-shiye-003",
      icon: ClipboardCheck,
      goal: "确认签约材料签署进度，推动本周完成盖章。",
      dispatchTarget: "CRM · 签约任务",
      contextFacts: [
        { label: "预计签约", value: "本周内" },
        { label: "金额", value: "¥ 89,500" },
      ],
      timeline: [{ at: "今天 08:00", title: "Action 已分发" }],
    }),
    action({
      id: "ma-7",
      title: "报价后 48h 跟进",
      opportunityId: "GD2025060555",
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      target: { name: "德信机电", type: "商机" },
      dueDate: tomorrow,
      dueTime: "10:00",
      priority: "high",
      status: "dispatched",
      assignee: "陈浩",
      assigneeId: "chenhao",
      estimateMins: 5,
      icon: RefreshCw,
      goal: "报价后 48 小时触达，确认客户决策节奏。",
      dispatchTarget: "企微 · 跟进提醒",
      contextFacts: [{ label: "报价发出", value: "46 小时前" }],
      timeline: [{ at: "今天 07:30", title: "进入 48h 跟进窗口" }],
    }),
    action({
      id: "ma-8",
      title: "合同条款修订确认",
      opportunityId: "HT2025060201",
      sourceAgent: "合同管理 Agent",
      agentId: "contract",
      target: { name: "锦程物流", type: "合同" },
      dueDate: formatDateKey(addDays(new Date(), 3)),
      dueTime: "14:00",
      priority: "low",
      status: "pending_dispatch",
      assignee: "李伟",
      assigneeId: "liwei",
      estimateMins: 15,
      icon: FileSearch,
      goal: "确认客户对修订条款的反馈并同步法务。",
      dispatchTarget: "FSM · 合同任务",
      contextFacts: [{ label: "修订版本", value: "Rev.B" }],
      timeline: [{ at: "昨天", title: "Agent 生成 Action" }],
    }),
    action({
      id: "ma-9",
      title: "月度回访计划执行",
      opportunityId: "GD2025060333",
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      target: { name: "华南分销联盟", type: "客户" },
      dueDate: formatDateKey(addDays(new Date(), 4)),
      dueTime: "09:00",
      priority: "medium",
      status: "pending_dispatch",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 20,
      icon: Phone,
      goal: "完成本月例行回访，更新客户健康度评分。",
      dispatchTarget: "CRM · 回访计划",
      contextFacts: [{ label: "健康度", value: "良好" }],
      timeline: [{ at: "本周一", title: "纳入月度计划" }],
    }),
    action({
      id: "ma-10",
      title: "出库单复核",
      opportunityId: "SO-20250612-018",
      sourceAgent: "仓储物流 Agent",
      agentId: "warehouse",
      target: { name: "SO-20250612-018", type: "出库单" },
      dueDate: today,
      dueTime: "13:30",
      priority: "low",
      status: "dispatched",
      assignee: "王芳",
      assigneeId: "wangfang",
      estimateMins: 4,
      icon: ClipboardCheck,
      goal: "复核出库明细与签收信息，确保物流节点可追溯。",
      dispatchTarget: "WMS · 复核任务",
      contextFacts: [{ label: "出库仓", value: "SZ-02" }],
      timeline: [{ at: "今天 11:00", title: "Action 已分发" }],
    }),
    action({
      id: "ma-11",
      title: "到货异常核查",
      opportunityId: "PO-77219",
      sourceAgent: "仓储物流 Agent",
      agentId: "warehouse",
      target: { name: "PO-77219", type: "采购单" },
      dueDate: tomorrow,
      dueTime: "11:00",
      priority: "medium",
      status: "in_progress",
      assignee: "王芳",
      assigneeId: "wangfang",
      estimateMins: 7,
      icon: FileSearch,
      goal: "核查到货差异原因并同步采购与供应商。",
      dispatchTarget: "WMS · 异常处理",
      terminalFeedback: "仓管员已接单，凭证调取中",
      lastSyncedAt: "3 分钟前",
      contextFacts: [{ label: "差异数量", value: "12 件" }],
      timeline: [{ at: "今天 10:20", title: "终端开始执行" }],
    }),
    action({
      id: "ma-12",
      title: "周例会准备",
      opportunityId: "INT-202506-W24",
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      target: { name: "团队周会", type: "内部" },
      dueDate: formatDateKey(addDays(new Date(), -3)),
      dueTime: "16:00",
      priority: "low",
      status: "completed",
      assignee: "李伟",
      assigneeId: "liwei",
      estimateMins: 30,
      icon: FileSearch,
      goal: "汇总本周跟进数据，准备周例会汇报材料。",
      dispatchTarget: "内部 · 运营看板",
      terminalFeedback: "材料已提交，例会已使用",
      lastSyncedAt: "3 天前",
      contextFacts: [{ label: "汇报时长", value: "10 分钟" }],
      timeline: [
        { at: "3 天前 16:30", title: "终端反馈已写回" },
        { at: "4 天前", title: "Action 已分发" },
      ],
    }),
  ];
}

const ACTIVE_FLOW_STATUSES: ActionFlowStatus[] = [
  "pending_dispatch",
  "dispatched",
  "in_progress",
  "timeout",
  "no_feedback",
];

export function countMyActionsPending(actions: MyAction[]): number {
  return actions.filter((a) => ACTIVE_FLOW_STATUSES.includes(a.status)).length;
}

function deltaFromCount(current: number, seed: number): number {
  if (current === 0) return 0;
  const magnitude = Math.max(1, Math.round(current * 0.12) + (seed % 2));
  return seed % 2 === 0 ? magnitude : -magnitude;
}

export function computeMyActionsSummary(actions: MyAction[]): MyActionsSummary {
  const pendingDispatch = actions.filter(
    (a) => a.status === "pending_dispatch"
  ).length;
  const dispatched = actions.filter((a) => a.status === "dispatched").length;
  const inProgress = actions.filter((a) => a.status === "in_progress").length;
  const withFeedback = actions.filter(
    (a) =>
      a.status === "completed" ||
      a.status === "rejected" ||
      Boolean(a.terminalFeedback && a.terminalFeedback !== "终端尚未回写")
  ).length;
  const timeoutAnomaly = actions.filter(
    (a) =>
      a.status === "timeout" ||
      a.status === "no_feedback"
  ).length;

  return {
    pendingDispatch,
    pendingDispatchDelta: deltaFromCount(pendingDispatch, 1),
    dispatched,
    dispatchedDelta: deltaFromCount(dispatched, 2),
    inProgress,
    inProgressDelta: deltaFromCount(inProgress, 3),
    withFeedback,
    withFeedbackDelta: deltaFromCount(withFeedback, 4),
    timeoutAnomaly,
    timeoutAnomalyDelta: deltaFromCount(timeoutAnomaly, 5),
  };
}

export type MyActionsFilters = {
  quick: MyActionQuickFilter;
  agentId: string;
  query: string;
  hk?: string;
  status?: ActionFlowStatus | "timeout_anomaly";
};

export function filterMyActions(
  actions: MyAction[],
  filters: MyActionsFilters
): MyAction[] {
  const today = formatDateKey(new Date());
  return actions.filter((item) => {
    if (filters.hk && item.assigneeId !== filters.hk) return false;
    if (filters.agentId !== "all" && item.agentId !== filters.agentId)
      return false;

    if (filters.quick === "today" && item.dueDate !== today) return false;
    if (filters.quick === "high" && item.priority !== "high") return false;
    if (
      filters.quick === "overdue" &&
      item.status !== "timeout" &&
      item.status !== "no_feedback"
    )
      return false;

    if (filters.status === "timeout_anomaly") {
      if (item.status !== "timeout" && item.status !== "no_feedback") {
        return false;
      }
    } else if (filters.status && item.status !== filters.status) {
      return false;
    }
    if (
      filters.quick === "agent" &&
      filters.agentId === "all"
    )
      return false;

    const q = filters.query.trim().toLowerCase();
    if (q) {
      const hay = [
        item.title,
        item.opportunityId,
        item.target.name,
        item.sourceAgent,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function actionFlowStatusHref(
  status: ActionFlowStatus | "timeout_anomaly",
  hk?: string
): string {
  const q = new URLSearchParams();
  q.set("tab", "actions");
  if (status === "timeout_anomaly") {
    q.set("aquick", "overdue");
  } else {
    q.set("astatus", status);
    q.set("aquick", "all");
  }
  if (hk) q.set("hk", hk);
  return `/?${q.toString()}`;
}

export function myActionHref(
  actionId: string,
  hk?: string,
  extra?: Record<string, string>
): string {
  const q = new URLSearchParams();
  q.set("tab", "actions");
  q.set("action", actionId);
  if (hk) q.set("hk", hk);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return `/?${q.toString()}`;
}

export { resolveCalendarAssigneeFromHk as resolveMyActionsAssigneeFromHk };

export function formatDueLabel(date: string, time: string): string {
  const today = formatDateKey(new Date());
  const tomorrow = formatDateKey(addDays(new Date(), 1));
  const mm = date.slice(5).replace("-", "/");
  if (date === today) return `今天 ${time}`;
  if (date === tomorrow) return `明天 ${time}`;
  return `${mm} ${time}`;
}

export function isDueToday(action: MyAction): boolean {
  return action.dueDate === formatDateKey(new Date());
}
