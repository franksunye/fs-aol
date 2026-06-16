import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const META = {
  business: {
    label: "业务查证",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    title: "来自 XLink Mongo 业务里程碑（报价单、签约等），可下钻时间线核对。",
  },
  agent: {
    label: "Agent 推断",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    title: "来自 Follow-up Agent 推理输出，须与业务查证对照审批，不可当作系统记账金额。",
  },
} as const;

export function CaseSourceBadge({
  kind,
  className,
}: {
  kind: keyof typeof META;
  className?: string;
}) {
  const meta = META[kind];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", meta.className, className)}
      title={meta.title}
    >
      {meta.label}
    </Badge>
  );
}
