import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileSearch,
  MessageSquare,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  addDays,
  formatDateKey,
  resolveCalendarAssigneeFromHk,
  type CalendarActionStatus,
  type CalendarPriority,
} from "./calendar-mock";

export type MyActionQuickFilter =
  | "all"
  | "today"
  | "high"
  | "overdue"
  | "agent";

export type MyActionFeedbackOption =
  | "contacted"
  | "considering"
  | "follow_up"
  | "completed";

export type MyActionChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

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
  status: CalendarActionStatus;
  assignee: string;
  assigneeId: string;
  estimateMins: number;
  workOrderKey?: string;
  icon: LucideIcon;
  goal: string;
  suggestions: string[];
  scriptPreview: string;
  checklist: MyActionChecklistItem[];
  contextFacts: { label: string; value: string }[];
  timeline: MyActionTimelineItem[];
};

export type MyActionsSummary = {
  pending: number;
  pendingDelta: number;
  dueToday: number;
  dueTodayDelta: number;
  inProgress: number;
  inProgressDelta: number;
  completed: number;
  completedDelta: number;
};

export const MY_ACTIONS_AGENT_OPTIONS = [
  { id: "all", label: "全部来源" },
  { id: "follow-up", label: "Follow-up Agent" },
  { id: "customer-follow", label: "客户跟进 Agent" },
  { id: "contract", label: "合同管理 Agent" },
] as const;

export const MY_ACTIONS_FEEDBACK_OPTIONS: {
  id: MyActionFeedbackOption;
  label: string;
}[] = [
  { id: "contacted", label: "已联系" },
  { id: "considering", label: "考虑中" },
  { id: "follow_up", label: "需再跟进" },
  { id: "completed", label: "已完成" },
];

function action(
  partial: Omit<MyAction, "icon"> & { icon?: LucideIcon }
): MyAction {
  return { icon: Phone, ...partial };
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
      status: "pending",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 5,
      workOrderKey: "demo:sz-zhizao-001",
      icon: Phone,
      goal: "确认客户对 V3 报价方案的接受度，推动进入签约流程。",
      suggestions: [
        "先确认客户是否已收到最新版报价 PDF",
        "若价格敏感，强调交付周期与服务保障差异",
        "约定 48 小时内二次回访时间",
      ],
      scriptPreview:
        "您好，我是管家张敏。想跟您确认一下上周发送的报价方案是否已查阅，看是否还有条款需要调整…",
      checklist: [
        { id: "c1", label: "准备商机背景与报价版本", done: true },
        { id: "c2", label: "拨打客户关键联系人电话", done: false },
        { id: "c3", label: "记录客户反馈并更新 CRM", done: false },
      ],
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
      suggestions: [
        "联系法务确认付款条款争议点",
        "同步业务侧让步底线",
      ],
      scriptPreview: "法务同事您好，华东零售合同目前卡在付款条款…",
      checklist: [
        { id: "c1", label: "核对审批流当前节点", done: true },
        { id: "c2", label: "整理补件材料清单", done: true },
        { id: "c3", label: "预约业务与法务三方沟通", done: false },
      ],
      contextFacts: [
        { label: "合同金额", value: "¥ 560,000" },
        { label: "当前节点", value: "法务复审" },
        { label: "已耗时", value: "3 个工作日" },
      ],
      timeline: [
        { at: "今天 09:10", title: "行动开始执行" },
        { at: "昨天 15:00", title: "提交法务补件" },
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
      status: "pending",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 10,
      icon: MessageSquare,
      goal: "回应客户对交付进度的顾虑，恢复信任并确认下一步安排。",
      suggestions: [
        "先致歉并说明当前项目里程碑",
        "提供可验证的进度凭证",
      ],
      scriptPreview: "王经理您好，关于您提到的交付进度问题，我们已同步项目组…",
      checklist: [
        { id: "c1", label: "拉取项目进度截图", done: false },
        { id: "c2", label: "电话回访客户", done: false },
      ],
      contextFacts: [
        { label: "情绪标签", value: "转弱" },
        { label: "最近互动", value: "7 天前" },
      ],
      timeline: [
        { at: "今天 07:50", title: "Agent 标记高优回访" },
      ],
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
      status: "overdue",
      assignee: "陈浩",
      assigneeId: "chenhao",
      estimateMins: 6,
      icon: RefreshCw,
      goal: "重新建立联系，确认停滞原因并约定下一步推进时间。",
      suggestions: ["优先电话触达", "若未接通则发企微留言"],
      scriptPreview: "您好，看到工单有一段时间没有更新，想了解一下目前推进上的阻碍…",
      checklist: [
        { id: "c1", label: "回顾上次沟通记录", done: true },
        { id: "c2", label: "执行触达", done: false },
      ],
      contextFacts: [
        { label: "停滞天数", value: "11 天" },
        { label: "报价状态", value: "已报价" },
      ],
      timeline: [
        { at: "昨天 10:00", title: "行动逾期", detail: "未按时执行" },
        { at: "3 天前", title: "Agent 创建行动" },
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
      status: "overdue",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 12,
      workOrderKey: "demo:ht-lingshou-004",
      icon: Phone,
      goal: "回访投诉处理结果，确认客户满意度并记录闭环。",
      suggestions: ["携带处理方案与补偿说明", "确认是否需升级工单"],
      scriptPreview: "您好，想跟进一下上次反馈的处理结果是否满意…",
      checklist: [
        { id: "c1", label: "阅读投诉工单详情", done: true },
        { id: "c2", label: "完成回访并记录", done: false },
      ],
      contextFacts: [
        { label: "投诉类型", value: "交付延迟" },
        { label: "处理状态", value: "已出方案" },
      ],
      timeline: [
        { at: "2 天前 09:30", title: "行动逾期" },
        { at: "4 天前", title: "投诉工单转入" },
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
      status: "pending",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 5,
      workOrderKey: "demo:yf-shiye-003",
      icon: ClipboardCheck,
      goal: "确认签约材料签署进度，推动本周完成盖章。",
      suggestions: ["确认双方法务是否已对齐条款"],
      scriptPreview: "想跟您确认合同签署进度，看是否需要我方协助推进…",
      checklist: [
        { id: "c1", label: "核对签署方信息", done: false },
        { id: "c2", label: "电话催办", done: false },
      ],
      contextFacts: [
        { label: "预计签约", value: "本周内" },
        { label: "金额", value: "¥ 89,500" },
      ],
      timeline: [{ at: "今天 08:00", title: "Agent 生成催办行动" }],
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
      status: "pending",
      assignee: "陈浩",
      assigneeId: "chenhao",
      estimateMins: 5,
      icon: RefreshCw,
      goal: "报价后 48 小时触达，确认客户决策节奏。",
      suggestions: ["询问决策人与评审时间"],
      scriptPreview: "您好，想了解一下报价方案的评审进度…",
      checklist: [{ id: "c1", label: "电话跟进", done: false }],
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
      status: "pending",
      assignee: "李伟",
      assigneeId: "liwei",
      estimateMins: 15,
      icon: FileSearch,
      goal: "确认客户对修订条款的反馈并同步法务。",
      suggestions: ["重点确认违约责任与付款节点"],
      scriptPreview: "关于条款第 4.2 条的修订，想确认贵司意见…",
      checklist: [{ id: "c1", label: "整理条款 diff", done: true }],
      contextFacts: [{ label: "修订版本", value: "Rev.B" }],
      timeline: [{ at: "昨天", title: "客户返回修订意见" }],
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
      status: "pending",
      assignee: "张敏",
      assigneeId: "zhangmin",
      estimateMins: 20,
      icon: Phone,
      goal: "完成本月例行回访，更新客户健康度评分。",
      suggestions: ["使用标准回访问卷", "记录新需求线索"],
      scriptPreview: "本月例行回访，想了解近期合作体验…",
      checklist: [{ id: "c1", label: "填写回访表", done: false }],
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
      status: "pending",
      assignee: "王芳",
      assigneeId: "wangfang",
      estimateMins: 4,
      icon: ClipboardCheck,
      goal: "复核出库明细与签收信息，确保物流节点可追溯。",
      suggestions: ["核对 SKU 数量与批次"],
      scriptPreview: "",
      checklist: [{ id: "c1", label: "系统复核", done: false }],
      contextFacts: [{ label: "出库仓", value: "SZ-02" }],
      timeline: [{ at: "今天 11:00", title: "Agent 推送复核任务" }],
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
      suggestions: ["调取签收照片", "联系供应商确认短少数量"],
      scriptPreview: "",
      checklist: [
        { id: "c1", label: "调取物流凭证", done: true },
        { id: "c2", label: "提交异常说明", done: false },
      ],
      contextFacts: [{ label: "差异数量", value: "12 件" }],
      timeline: [{ at: "今天 10:20", title: "行动开始执行" }],
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
      suggestions: ["导出采纳率与签约推进数据"],
      scriptPreview: "",
      checklist: [
        { id: "c1", label: "导出指标", done: true },
        { id: "c2", label: "整理案例", done: true },
      ],
      contextFacts: [{ label: "汇报时长", value: "10 分钟" }],
      timeline: [
        { at: "3 天前 16:30", title: "行动完成" },
        { at: "4 天前", title: "创建行动" },
      ],
    }),
  ];
}

export function countMyActionsPending(actions: MyAction[]): number {
  return actions.filter(
    (a) => a.status === "pending" || a.status === "in_progress" || a.status === "overdue"
  ).length;
}

export function computeMyActionsSummary(actions: MyAction[]): MyActionsSummary {
  const today = formatDateKey(new Date());
  const pending = actions.filter((a) => a.status === "pending").length;
  const dueToday = actions.filter(
    (a) =>
      a.dueDate === today &&
      (a.status === "pending" || a.status === "in_progress")
  ).length;
  const inProgress = actions.filter((a) => a.status === "in_progress").length;
  const completed = actions.filter((a) => a.status === "completed").length;

  return {
    pending,
    pendingDelta: 2,
    dueToday,
    dueTodayDelta: 1,
    inProgress,
    inProgressDelta: 1,
    completed,
    completedDelta: 5,
  };
}

export type MyActionsFilters = {
  quick: MyActionQuickFilter;
  agentId: string;
  query: string;
  hk?: string;
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
    if (filters.quick === "overdue" && item.status !== "overdue") return false;
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
