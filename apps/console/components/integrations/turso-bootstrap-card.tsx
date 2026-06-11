import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";

export function TursoBootstrapCard({ tursoOk }: { tursoOk: boolean }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Turso Tracking</span>
          <DataStateBadge state={tursoOk ? "live" : "not_connected"} />
        </div>
        <p className="text-muted-foreground text-xs">
          follow_up_logs / traces / actions / runtime_config ·
          连接由部署 bootstrap（LIBSQL_URL）管理，此处只读探测。
        </p>
      </CardContent>
    </Card>
  );
}
