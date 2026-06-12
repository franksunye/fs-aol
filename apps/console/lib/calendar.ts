import { Phone } from "lucide-react";
import { listActions, mapActionsToExecution } from "./tracking/actions";
import { loadPilotHousekeepers } from "./pilot-housekeepers";
import { resolveExecutionAssigneeFromHk } from "./action-execution-mock";
import type { ExecutionAction } from "./action-execution-mock";
import type { ExecutionStatus } from "./execution-status";
import {
  formatDateKey,
  type CalendarAction,
  type CalendarActionStatus,
} from "./calendar-mock";

export type CalendarDataSource = "live" | "empty";

function mapExecutionStatus(
  status: ExecutionStatus,
  dueDate: string
): CalendarActionStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  const todayKey = formatDateKey(new Date());
  if (
    dueDate < todayKey &&
    (status === "timeout" ||
      status === "no_feedback" ||
      status === "pending_dispatch" ||
      status === "dispatched")
  ) {
    return "overdue";
  }
  if (status === "timeout" || status === "no_feedback") return "overdue";
  return "pending";
}

function executionToCalendarAction(action: ExecutionAction): CalendarAction {
  const endHour = action.dueTime?.split(":")[0] ?? "18";
  const endMin = action.dueTime?.split(":")[1] ?? "00";
  const dueParts = action.dueDate.split("-").map(Number);
  const startDate = new Date(dueParts[0], dueParts[1] - 1, dueParts[2]);
  const endMins = Number(endHour) * 60 + Number(endMin);
  const startMins = Math.max(0, endMins - (action.estimateMins || 15));
  const startTime = `${String(Math.floor(startMins / 60)).padStart(2, "0")}:${String(startMins % 60).padStart(2, "0")}`;

  return {
    id: `live-${action.id}`,
    title: action.title,
    date: action.dueDate,
    startTime,
    endTime: action.dueTime || "18:00",
    relatedObject: {
      name: action.target.name,
      type: action.target.type,
    },
    sourceAgent: action.sourceAgent,
    agentId: action.agentId,
    priority: action.priority,
    assignee: action.assignee,
    assigneeId: action.assigneeId,
    status: mapExecutionStatus(action.status, action.dueDate),
    icon: Phone,
    workOrderKey: action.workOrderKey,
    executionActionId: action.id,
  };
}

export async function loadCalendarActions(hk?: string): Promise<{
  actions: CalendarAction[];
  dataSource: CalendarDataSource;
}> {
  const pilots = loadPilotHousekeepers();
  const assigneeId = resolveExecutionAssigneeFromHk(hk, pilots);
  const rows = await listActions({
    housekeeperId: hk,
    limit: 200,
  });
  const mapped = await mapActionsToExecution(rows);
  const scoped = assigneeId
    ? mapped.filter((a) => a.assigneeId === assigneeId)
    : mapped;
  const actions = scoped.map(executionToCalendarAction);
  return {
    actions,
    dataSource: actions.length > 0 ? "live" : "empty",
  };
}
