export const CALENDAR_HOME_PATH = "/calendar";

export const CALENDAR_TITLE = "日历";

export const CALENDAR_SUBTITLE =
  "查看 Action 截止时间、Agent 计划与 SLA 风险。";

export function calendarHref(hk?: string): string {
  if (!hk) return CALENDAR_HOME_PATH;
  return `${CALENDAR_HOME_PATH}?hk=${encodeURIComponent(hk)}`;
}
