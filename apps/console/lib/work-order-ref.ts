/** 工单展示号：orderNum 给人看，work_order_id 尾号消歧（XLink orderNum 可能重复）。 */

export function formatWorkOrderRef(row: {
  orderNum?: string | null;
  workOrderId?: string | null;
}): string {
  const num = row.orderNum?.trim();
  const wid = row.workOrderId?.trim();
  if (num && wid) return `${num} · ${wid.slice(-6)}`;
  return num || wid || "—";
}

export function formatWorkOrderRefShort(row: {
  orderNum?: string | null;
  workOrderId?: string | null;
}): string {
  const num = row.orderNum?.trim();
  if (num) return num;
  const wid = row.workOrderId?.trim();
  return wid ? `…${wid.slice(-8)}` : "—";
}
