import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import type { GovernanceAuditRow } from "@/lib/governance-audit";

const DECISION_LABEL: Record<string, string> = {
  approved: "已同意",
  modified: "已修改",
  rejected: "已拒绝",
  followed_up: "已跟进",
};

export function FollowUpAuditFeed({ rows }: { rows: GovernanceAuditRow[] }) {
  if (rows.length === 0) {
    return (
      <Card className="border-border p-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Follow-up 审批审计</h2>
          <DataStateBadge state="live" />
        </div>
        <p className="text-muted-foreground text-sm">暂无审批记录。</p>
      </Card>
    );
  }

  return (
    <Card className="border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Follow-up 审批审计</h2>
        <DataStateBadge state="live" />
        <span className="text-muted-foreground text-xs">最近 {rows.length} 条</span>
      </div>
      <ul className="divide-border divide-y text-sm">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {row.createdAt.slice(0, 16).replace("T", " ")}
            </span>
            <span className="font-medium">{row.workOrderId || "—"}</span>
            <span>{DECISION_LABEL[row.decision] ?? row.decision}</span>
            {row.actionStatus ? (
              <span className="text-muted-foreground text-xs">
                Action: {row.actionStatus}
              </span>
            ) : null}
            <span className="text-muted-foreground text-xs">{row.operator}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
