/**
 * DRY_RUN execution notification preview (v0.4).
 * Logs markdown that would be sent via WeCom when an Action enters pending_dispatch.
 */
export function previewExecutionNotify(input: {
  title: string;
  orderRef: string;
  assigneeId: string;
  consoleBaseUrl?: string;
  actionId: number;
  dedupeKey: string;
}): string {
  const base =
    input.consoleBaseUrl ||
    process.env.CONSOLE_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const q = new URLSearchParams();
  q.set("tab", "execution");
  q.set("action", String(input.actionId));
  const link = `${base.replace(/\/$/, "")}/?${q.toString()}`;
  const markdown = [
    `### 待执行 · ${input.title}`,
    `> 工单 \`${input.orderRef}\``,
    `> 管家 ${input.assigneeId}`,
    `> [打开 Console 执行反馈](${link})`,
    `> _DRY_RUN 预览 · dedupe=${input.dedupeKey}_`,
  ].join("\n");
  console.info("[企微执行预览] 未发送（DRY_RUN）\n%s", markdown);
  return markdown;
}
