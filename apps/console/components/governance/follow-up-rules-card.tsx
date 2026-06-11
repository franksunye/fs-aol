import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";

const ACTION_CODES = [
  { code: "CALL_SIGN", label: "电话沟通签约意向" },
  { code: "VISIT_AGAIN", label: "预约二次上门" },
  { code: "PRICE_TALK", label: "议价/分期" },
  { code: "QUOTE_REVISE", label: "修订报价单" },
  { code: "CLOSE_LOST", label: "判定丢单（须人工确认）" },
];

export function FollowUpRulesCard({
  eventStatuses = "206",
  maxAgeDays = 14,
  pilots = "",
}: {
  eventStatuses?: string;
  maxAgeDays?: number;
  pilots?: string;
}) {
  return (
    <Card className="border-border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Follow-up 楔子规则（206 待签约）</h2>
        <DataStateBadge state="live" label="运行时配置" />
      </div>
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        <li>
          仅跟进 status={eventStatuses || "206"}，{maxAgeDays} 天窗内工单
        </li>
        {pilots ? <li>试点管家：{pilots}</li> : null}
        <li>人审批准后进入待执行；拒绝/已跟进直接闭环</li>
        <li>企微通知保持 DRY_RUN 预览，Console 提交执行反馈</li>
      </ul>
      <p className="text-muted-foreground mt-3 text-xs font-medium">建议动作码</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ACTION_CODES.map((a) => (
          <span
            key={a.code}
            className="bg-muted rounded-md px-2 py-0.5 font-mono text-[11px]"
          >
            {a.code}
          </span>
        ))}
      </div>
    </Card>
  );
}
