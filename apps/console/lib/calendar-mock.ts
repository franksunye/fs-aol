import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileSearch,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";

export type CalendarPriority = "high" | "medium" | "low";
export type CalendarActionStatus =
  | "pending"
  | "in_progress"
  | "overdue"
  | "completed";

export type CalendarAction = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  relatedObject: { name: string; type: string };
  sourceAgent: string;
  agentId: string;
  priority: CalendarPriority;
  assignee: string;
  assigneeId: string;
  status: CalendarActionStatus;
  icon: LucideIcon;
  workOrderKey?: string;
  /** 对应 Action 流转条目，用于跨 Tab 跳转 */
  myActionId?: string;
};

export type CalendarSummary = {
  todayActions: number;
  todayActionsDelta: number;
  dueToday: number;
  dueTodayDelta: number;
  weeklySchedule: number;
  weeklyScheduleDelta: number;
  overdue: number;
  overdueDelta: number;
};

export const CALENDAR_AGENT_OPTIONS = [
  { id: "all", label: "全部 Agent" },
  { id: "follow-up", label: "Follow-up Agent" },
  { id: "customer-follow", label: "客户跟进 Agent" },
  { id: "contract", label: "合同管理 Agent" },
  { id: "warehouse", label: "仓储物流 Agent" },
] as const;

export const CALENDAR_PRIORITY_OPTIONS = [
  { id: "all", label: "全部优先级" },
  { id: "high", label: "高" },
  { id: "medium", label: "中" },
  { id: "low", label: "低" },
] as const;

export const CALENDAR_STATUS_OPTIONS = [
  { id: "all", label: "全部状态" },
  { id: "pending", label: "待执行" },
  { id: "in_progress", label: "进行中" },
  { id: "overdue", label: "逾期" },
  { id: "completed", label: "已完成" },
] as const;

export const CALENDAR_ASSIGNEE_OPTIONS = [
  { id: "all", label: "全部负责人" },
  { id: "zhangmin", label: "张敏" },
  { id: "liwei", label: "李伟" },
  { id: "wangfang", label: "王芳" },
  { id: "chenhao", label: "陈浩" },
] as const;

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatMonthTitle(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function formatShortDateTime(dateKey: string, time: string): string {
  const d = parseDateKey(dateKey);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd} ${time}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

function action(
  partial: Omit<CalendarAction, "icon"> & { icon?: LucideIcon }
): CalendarAction {
  return {
    icon: Phone,
    ...partial,
  };
}

/** 以当前日期为锚点生成演示数据 */
export function getCalendarMockActions(): CalendarAction[] {
  const today = new Date();
  const t = (offset: number) => formatDateKey(addDays(today, offset));

  return [
    action({
      id: "cal-1",
      title: "电话回访客户",
      date: t(0),
      startTime: "09:00",
      endTime: "09:30",
      relatedObject: { name: "深圳智造科技有限公司", type: "客户" },
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      priority: "high",
      assignee: "张敏",
      assigneeId: "zhangmin",
      status: "in_progress",
      icon: Phone,
      workOrderKey: "demo:sz-zhizao-001",
      myActionId: "ma-1",
    }),
    action({
      id: "cal-2",
      title: "合同审批跟进",
      date: t(0),
      startTime: "10:30",
      endTime: "11:00",
      relatedObject: { name: "华东零售集团", type: "合同" },
      sourceAgent: "合同管理 Agent",
      agentId: "contract",
      priority: "medium",
      assignee: "李伟",
      assigneeId: "liwei",
      status: "pending",
      icon: ClipboardCheck,
      myActionId: "ma-2",
    }),
    action({
      id: "cal-3",
      title: "出库单复核",
      date: t(0),
      startTime: "13:30",
      endTime: "14:00",
      relatedObject: { name: "SO-20250612-018", type: "出库单" },
      sourceAgent: "仓储物流 Agent",
      agentId: "warehouse",
      priority: "low",
      assignee: "王芳",
      assigneeId: "wangfang",
      status: "pending",
      icon: Truck,
      myActionId: "ma-10",
    }),
    action({
      id: "cal-4",
      title: "报价方案确认",
      date: t(0),
      startTime: "14:30",
      endTime: "15:00",
      relatedObject: { name: "星河物业服务中心", type: "商机" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "high",
      assignee: "张敏",
      assigneeId: "zhangmin",
      status: "pending",
      icon: RefreshCw,
      workOrderKey: "demo:xh-wuye-002",
    }),
    action({
      id: "cal-5",
      title: "停滞工单复盘",
      date: t(0),
      startTime: "15:30",
      endTime: "16:00",
      relatedObject: { name: "WO-88421", type: "工单" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "medium",
      assignee: "陈浩",
      assigneeId: "chenhao",
      status: "pending",
      icon: FileSearch,
    }),
    action({
      id: "cal-6",
      title: "客户情绪回访",
      date: t(0),
      startTime: "16:30",
      endTime: "17:00",
      relatedObject: { name: "蓝鲸科技", type: "客户" },
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      priority: "medium",
      assignee: "李伟",
      assigneeId: "liwei",
      status: "pending",
      icon: Phone,
    }),
    action({
      id: "cal-7",
      title: "签约催办",
      date: t(1),
      startTime: "09:30",
      endTime: "10:00",
      relatedObject: { name: "云帆实业", type: "合同" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "high",
      assignee: "张敏",
      assigneeId: "zhangmin",
      status: "pending",
      icon: ClipboardCheck,
      workOrderKey: "demo:yf-shiye-003",
    }),
    action({
      id: "cal-8",
      title: "到货异常核查",
      date: t(1),
      startTime: "11:00",
      endTime: "11:30",
      relatedObject: { name: "PO-77219", type: "采购单" },
      sourceAgent: "仓储物流 Agent",
      agentId: "warehouse",
      priority: "medium",
      assignee: "王芳",
      assigneeId: "wangfang",
      status: "pending",
      icon: Truck,
    }),
    action({
      id: "cal-9",
      title: "报价后 48h 跟进",
      date: t(2),
      startTime: "10:00",
      endTime: "10:30",
      relatedObject: { name: "德信机电", type: "商机" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "high",
      assignee: "陈浩",
      assigneeId: "chenhao",
      status: "pending",
      icon: RefreshCw,
    }),
    action({
      id: "cal-10",
      title: "合同条款修订确认",
      date: t(3),
      startTime: "14:00",
      endTime: "14:45",
      relatedObject: { name: "锦程物流", type: "合同" },
      sourceAgent: "合同管理 Agent",
      agentId: "contract",
      priority: "low",
      assignee: "李伟",
      assigneeId: "liwei",
      status: "pending",
      icon: ClipboardCheck,
    }),
    action({
      id: "cal-11",
      title: "月度回访计划",
      date: t(4),
      startTime: "09:00",
      endTime: "09:45",
      relatedObject: { name: "华南分销联盟", type: "客户" },
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      priority: "medium",
      assignee: "张敏",
      assigneeId: "zhangmin",
      status: "pending",
      icon: Phone,
    }),
    action({
      id: "cal-12",
      title: "库存盘点跟进",
      date: t(5),
      startTime: "13:00",
      endTime: "13:30",
      relatedObject: { name: "WH-SZ-02", type: "仓库" },
      sourceAgent: "仓储物流 Agent",
      agentId: "warehouse",
      priority: "low",
      assignee: "王芳",
      assigneeId: "wangfang",
      status: "pending",
      icon: Truck,
    }),
    action({
      id: "cal-13",
      title: "回款节点提醒",
      date: t(6),
      startTime: "15:00",
      endTime: "15:30",
      relatedObject: { name: "北辰建设", type: "合同" },
      sourceAgent: "合同管理 Agent",
      agentId: "contract",
      priority: "high",
      assignee: "李伟",
      assigneeId: "liwei",
      status: "pending",
      icon: ClipboardCheck,
    }),
    action({
      id: "cal-14",
      title: "停滞商机唤醒",
      date: t(-1),
      startTime: "10:00",
      endTime: "10:30",
      relatedObject: { name: "光合能源", type: "商机" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "high",
      assignee: "陈浩",
      assigneeId: "chenhao",
      status: "overdue",
      icon: RefreshCw,
    }),
    action({
      id: "cal-15",
      title: "客户投诉回访",
      date: t(-2),
      startTime: "09:30",
      endTime: "10:00",
      relatedObject: { name: "恒泰零售", type: "客户" },
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      priority: "high",
      assignee: "张敏",
      assigneeId: "zhangmin",
      status: "overdue",
      icon: Phone,
      workOrderKey: "demo:ht-lingshou-004",
    }),
    action({
      id: "cal-16",
      title: "周例会准备",
      date: t(-3),
      startTime: "16:00",
      endTime: "16:30",
      relatedObject: { name: "团队周会", type: "内部" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "low",
      assignee: "李伟",
      assigneeId: "liwei",
      status: "completed",
      icon: FileSearch,
    }),
    action({
      id: "cal-17",
      title: "报价池巡检",
      date: t(7),
      startTime: "11:30",
      endTime: "12:00",
      relatedObject: { name: "报价池", type: "巡检" },
      sourceAgent: "Follow-up Agent",
      agentId: "follow-up",
      priority: "medium",
      assignee: "王芳",
      assigneeId: "wangfang",
      status: "pending",
      icon: RefreshCw,
    }),
    action({
      id: "cal-18",
      title: "发货时效核对",
      date: t(8),
      startTime: "14:30",
      endTime: "15:00",
      relatedObject: { name: "SO-20250620-006", type: "出库单" },
      sourceAgent: "仓储物流 Agent",
      agentId: "warehouse",
      priority: "medium",
      assignee: "王芳",
      assigneeId: "wangfang",
      status: "pending",
      icon: Truck,
    }),
    action({
      id: "cal-19",
      title: "签约材料补齐",
      date: t(-5),
      startTime: "10:30",
      endTime: "11:00",
      relatedObject: { name: "明远科技", type: "合同" },
      sourceAgent: "合同管理 Agent",
      agentId: "contract",
      priority: "medium",
      assignee: "李伟",
      assigneeId: "liwei",
      status: "completed",
      icon: ClipboardCheck,
    }),
    action({
      id: "cal-20",
      title: "高优客户触达",
      date: t(10),
      startTime: "09:00",
      endTime: "09:45",
      relatedObject: { name: "鼎新制造", type: "客户" },
      sourceAgent: "客户跟进 Agent",
      agentId: "customer-follow",
      priority: "high",
      assignee: "张敏",
      assigneeId: "zhangmin",
      status: "pending",
      icon: Phone,
    }),
  ];
}

export type CalendarFilters = {
  agentId: string;
  priority: string;
  status: string;
  assigneeId: string;
  hk?: string;
};

/** 将工作台管家筛选（试点 ID）映射到日历 mock 负责人 */
export function resolveCalendarAssigneeFromHk(
  hk: string | undefined,
  pilots: { id: string; name: string }[]
): string | undefined {
  if (!hk) return undefined;
  const direct = CALENDAR_ASSIGNEE_OPTIONS.find((o) => o.id === hk);
  if (direct && direct.id !== "all") return direct.id;
  const pilot = pilots.find((p) => p.id === hk);
  if (!pilot) return undefined;
  const byName = CALENDAR_ASSIGNEE_OPTIONS.find((o) => o.label === pilot.name);
  return byName?.id !== "all" ? byName?.id : undefined;
}

export function filterCalendarActions(
  actions: CalendarAction[],
  filters: CalendarFilters
): CalendarAction[] {
  return actions.filter((item) => {
    if (filters.hk && item.assigneeId !== filters.hk) return false;
    if (filters.agentId !== "all" && item.agentId !== filters.agentId)
      return false;
    if (filters.priority !== "all" && item.priority !== filters.priority)
      return false;
    if (filters.status !== "all" && item.status !== filters.status)
      return false;
    if (
      filters.assigneeId !== "all" &&
      item.assigneeId !== filters.assigneeId
    )
      return false;
    return true;
  });
}

export function computeCalendarSummary(
  actions: CalendarAction[]
): CalendarSummary {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const weekStart = addDays(today, -((today.getDay() + 6) % 7));
  const weekEnd = addDays(weekStart, 6);

  const todayActions = actions.filter((a) => a.date === todayKey);
  const dueToday = todayActions.filter(
    (a) => a.status === "pending" || a.status === "in_progress"
  );
  const weeklySchedule = actions.filter((a) => {
    const d = parseDateKey(a.date);
    return d >= weekStart && d <= weekEnd;
  });
  const overdue = actions.filter((a) => a.status === "overdue");

  return {
    todayActions: todayActions.length,
    todayActionsDelta: 2,
    dueToday: dueToday.length,
    dueTodayDelta: 1,
    weeklySchedule: weeklySchedule.length,
    weeklyScheduleDelta: 6,
    overdue: overdue.length,
    overdueDelta: 1,
  };
}

export function actionsForDate(
  actions: CalendarAction[],
  dateKey: string
): CalendarAction[] {
  return actions
    .filter((a) => a.date === dateKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function upcomingActions(
  actions: CalendarAction[],
  days = 7
): CalendarAction[] {
  const today = new Date();
  const end = addDays(today, days);
  return actions
    .filter((a) => {
      const d = parseDateKey(a.date);
      return d >= today && d <= end;
    })
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });
}

export function overdueActions(actions: CalendarAction[]): CalendarAction[] {
  return actions
    .filter((a) => a.status === "overdue")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function dueSoonActions(actions: CalendarAction[]): CalendarAction[] {
  const today = new Date();
  const limit = addDays(today, 2);
  return actions
    .filter((a) => {
      if (a.priority !== "high") return false;
      const d = parseDateKey(a.date);
      return d >= today && d <= limit && a.status === "pending";
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calendarMonthCells(month: Date): Date[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const startWeekday = (start.getDay() + 6) % 7;
  const gridStart = addDays(start, -startWeekday);
  const endWeekday = (end.getDay() + 6) % 7;
  const gridEnd = addDays(end, 6 - endWeekday);
  const cells: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
    cells.push(new Date(d));
  }
  return cells;
}

export const CALENDAR_PRIORITY_LABELS: Record<CalendarPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const CALENDAR_STATUS_LABELS: Record<CalendarActionStatus, string> = {
  pending: "待执行",
  in_progress: "进行中",
  overdue: "逾期",
  completed: "已完成",
};

export function overdueDays(dateKey: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateKey(dateKey);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 1);
}
