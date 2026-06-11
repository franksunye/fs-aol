import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  FSM_INTEGRATION_ID,
  integrationHref,
} from "@/lib/integrations-nav";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";

export function FsmConfigMirrorCard({
  runtime,
}: {
  runtime: RuntimeConfigPublic;
}) {
  const c = runtime.config;
  const rows = [
    ["FSM 事件码", c.fsm_event_statuses],
    ["stale_days", String(c.fsm_stale_days)],
    ["max_age_days", String(c.fsm_max_age_days)],
    ["time_field", c.fsm_time_field],
    ["batch_limit", String(c.fsm_batch_limit)],
    ["试点管家", c.pilot_housekeepers || "—"],
    ["Mongo DB", c.fsm_mongo_db],
  ] as const;

  return (
    <Card className="gap-0 border-dashed py-0">
      <CardContent className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">FSM 摄取策略</h3>
            <DataStateBadge state="live" label="只读镜像" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={
              <Link href={integrationHref(FSM_INTEGRATION_ID, "ingestion")} />
            }
          >
            <ExternalLink className="size-3.5" />
            在集成页编辑
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          连接与摄取策略统一在系统集成工作台维护，避免双处编辑。
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="text-xs">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href={integrationHref(FSM_INTEGRATION_ID, "protocol")}
          className="text-primary text-xs underline-offset-2 hover:underline"
        >
          查看集成协议（对象映射 / 码表）
        </Link>
      </CardContent>
    </Card>
  );
}
