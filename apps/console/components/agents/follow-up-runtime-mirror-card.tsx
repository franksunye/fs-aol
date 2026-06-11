import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import type { EngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export function FollowUpRuntimeMirrorCard({
  runtime,
}: {
  runtime: EngineRuntimeSnapshot | null;
}) {
  if (!runtime) {
    return (
      <Card className="border-border mb-4 gap-2 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">运行时镜像</h2>
          <DataStateBadge state="not_connected" label="尚无 cron 快照" />
        </div>
        <p className="text-muted-foreground text-xs">
          运行 <code className="font-mono">make cron</code> 或{" "}
          <code className="font-mono">make seed-local</code> 后刷新本页。
        </p>
      </Card>
    );
  }

  const s = runtime.snapshot;
  const pilots = Array.isArray(s.pilots)
    ? (s.pilots as { name?: string }[])
        .map((p) => p.name)
        .filter(Boolean)
        .join("、")
    : "—";

  return (
    <Card className="border-border mb-4 gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">运行时镜像（只读）</h2>
        <DataStateBadge state="live" />
        <span className="text-muted-foreground text-xs">
          上次 cron {runtime.runAt.slice(0, 16).replace("T", " ")}
        </span>
      </div>
      <dl className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">触发范围</dt>
          <dd className="font-medium">
            status={String((s.fsm_event_statuses as string[])?.join(",") ?? "206")}
            ，{String(s.fsm_max_age_days ?? 14)} 天窗
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">试点管家</dt>
          <dd className="font-medium">{pilots || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Agent 模式</dt>
          <dd className="font-medium">{String(s.agent_mode ?? "—")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">LLM</dt>
          <dd className="font-medium">
            {String(s.llm_provider ?? "—")} / {String(s.llm_model ?? "—")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">企微</dt>
          <dd className="font-medium">
            {s.dry_run ? "DRY_RUN 预览" : "真发模式"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">摄取源</dt>
          <dd className="font-medium">{String(s.fsm_source ?? "—")}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-[11px]">
        下方配置区为场景样例，修改不会写回引擎；以 GHA / cron 环境变量为准。
      </p>
    </Card>
  );
}
