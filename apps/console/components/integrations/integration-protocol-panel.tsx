"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Play, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import type {
  IntegrationBinding,
  MappedWorkOrder,
  MergedWorkbenchDisplay,
} from "@/lib/integration-bindings/types";
import {
  mergeWorkbenchDisplay,
  resolveRelatedObject,
  resolverKindLabel,
  WORKBENCH_FACET_SAMPLE_ROW,
} from "@/lib/integration-bindings/workbench-display";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";
import { saveRuntimeConfig } from "@/lib/runtime-config/client";
import { RelatedObjectCell } from "@/components/action-center/related-object-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const TRANSFORM_LABEL: Record<string, string> = {
  direct: "直取",
  lookup: "码表",
  coalesce: "合并",
  const: "常量",
  source_ref: "溯源",
};

function TransformBadge({ op }: { op: string }) {
  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      {TRANSFORM_LABEL[op] ?? op}
    </Badge>
  );
}

function JsonBlock({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | MappedWorkOrder;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-xs font-medium">{title}</p>
      <pre className="bg-muted/50 max-h-64 overflow-auto rounded-md border p-3 font-mono text-[11px] leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function WorkbenchDisplayCard({
  binding,
  workbenchDisplay,
  runtime,
  onRuntimeSaved,
}: {
  binding: IntegrationBinding;
  workbenchDisplay: MergedWorkbenchDisplay | null;
  runtime: RuntimeConfigPublic;
  onRuntimeSaved: (next: RuntimeConfigPublic) => void;
}) {
  const catalog = workbenchDisplay?.facetCatalog ?? [];
  const bindingKey = workbenchDisplay?.bindingKey ?? `${binding.id}@${binding.version}`;
  const defaultEnabled = useMemo(() => {
    const spec = binding.objects.find((o) => o.workbench_display)?.workbench_display;
    return spec?.default_enabled ?? catalog.map((f) => f.id);
  }, [binding.objects, catalog]);

  const [enabledIds, setEnabledIds] = useState<string[]>(
    workbenchDisplay?.enabledFacetIds ?? defaultEnabled
  );
  const [facetBusy, setFacetBusy] = useState(false);

  useEffect(() => {
    setEnabledIds(workbenchDisplay?.enabledFacetIds ?? defaultEnabled);
  }, [workbenchDisplay?.enabledFacetIds, defaultEnabled]);

  const previewRelated = useMemo(() => {
    const merged =
      workbenchDisplay ??
      mergeWorkbenchDisplay(binding, runtime.config.binding_overrides);
    if (!merged) return null;
    const previewMerged = { ...merged, enabledFacetIds: enabledIds };
    return resolveRelatedObject(previewMerged, WORKBENCH_FACET_SAMPLE_ROW);
  }, [workbenchDisplay, binding, runtime.config.binding_overrides, enabledIds]);

  const facetsDirty = useMemo(() => {
    const current = workbenchDisplay?.enabledFacetIds ?? defaultEnabled;
    if (current.length !== enabledIds.length) return true;
    return current.some((id, i) => id !== enabledIds[i]);
  }, [workbenchDisplay?.enabledFacetIds, defaultEnabled, enabledIds]);

  const toggleFacet = (id: string) => {
    setEnabledIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveFacets = async () => {
    setFacetBusy(true);
    try {
      const nextOverrides = {
        ...(runtime.config.binding_overrides ?? {}),
        [bindingKey]: {
          ...(runtime.config.binding_overrides?.[bindingKey] ?? {}),
          workbench_display: { enabled_facets: enabledIds },
        },
      };
      const next = await saveRuntimeConfig(
        { binding_overrides: nextOverrides },
        "Workbench display facets updated"
      );
      onRuntimeSaved(next);
      toast.success("工作台展示已保存", {
        description: "Action 列表关联对象列将按勾选字段展示",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setFacetBusy(false);
    }
  };

  const resetFacets = () => setEnabledIds(defaultEnabled);

  if (!catalog.length) return null;

  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">工作台展示</h3>
          <DataStateBadge state="live" label="Turso overrides" />
        </div>
        <p className="text-muted-foreground text-xs">
          配置 Action 中心「关联对象」列在工单号与类型下方展示的附加字段（facets）。
          保存至 runtime_config.binding_overrides，无需发版。
        </p>
        <ul className="space-y-2">
          {catalog.map((facet) => (
            <li
              key={facet.id}
              className="flex items-start gap-2 rounded-md border px-3 py-2"
            >
              <input
                type="checkbox"
                id={`facet-${facet.id}`}
                checked={enabledIds.includes(facet.id)}
                onChange={() => toggleFacet(facet.id)}
                className="mt-0.5"
              />
              <label htmlFor={`facet-${facet.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span className="text-sm font-medium">{facet.label}</span>
                <span className="text-muted-foreground ml-2 font-mono text-[10px]">
                  {facet.id}
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {resolverKindLabel(facet.resolver.kind)}
                </p>
              </label>
            </li>
          ))}
        </ul>
        {previewRelated ? (
          <div className="bg-muted/40 rounded-md border p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">列表预览</p>
            <RelatedObjectCell related={previewRelated} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={facetBusy || !facetsDirty}
            onClick={saveFacets}
          >
            {facetBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span className="ml-1">保存展示字段</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={facetBusy}
            onClick={resetFacets}
          >
            <RotateCcw className="size-3.5" />
            <span className="ml-1">恢复默认</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationProtocolPanel({
  binding,
  activeEventStatuses,
  workbenchDisplay,
  runtime,
  onRuntimeSaved,
}: {
  binding: IntegrationBinding;
  activeEventStatuses: string[];
  workbenchDisplay?: MergedWorkbenchDisplay | null;
  runtime?: RuntimeConfigPublic;
  onRuntimeSaved?: (next: RuntimeConfigPublic) => void;
}) {
  const [codeSearch, setCodeSearch] = useState("");
  const [sampleBusy, setSampleBusy] = useState(false);
  const [sampleSource, setSampleSource] = useState<"mongo" | "builtin" | null>(
    null
  );
  const [sampleExternal, setSampleExternal] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [sampleCanonical, setSampleCanonical] = useState<MappedWorkOrder | null>(
    null
  );

  const obj = binding.objects[0];
  const eventTable = binding.code_tables.status_to_event_type ?? {};
  const taskTable = binding.code_tables.status_to_task_type ?? {};

  const filteredTaskEntries = Object.entries(taskTable).filter(([code, label]) => {
    const q = codeSearch.trim();
    if (!q) return true;
    return code.includes(q) || label.includes(q);
  });

  const runSample = useCallback(async () => {
    setSampleBusy(true);
    try {
      const res = await fetch("/api/integrations/fsm/sample-transform", {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setSampleSource(j.source);
      setSampleExternal(j.external);
      setSampleCanonical(j.canonical);
    } finally {
      setSampleBusy(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        集成协议由代码契约定义（binding {binding.id}@{binding.version}）。
        工作台关联对象展示字段可在下方配置；字段映射与码表仍由契约版本管理。
      </p>

      {runtime && onRuntimeSaved ? (
        <WorkbenchDisplayCard
          binding={binding}
          workbenchDisplay={workbenchDisplay ?? null}
          runtime={runtime}
          onRuntimeSaved={onRuntimeSaved}
        />
      ) : null}

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">对象映射</h3>
            <DataStateBadge state="live" label="代码契约" />
          </div>
          <p className="text-sm">
            <span className="font-mono text-xs">
              {obj.external.collection}
            </span>
            <span className="text-muted-foreground mx-2">→</span>
            <span className="font-medium">{obj.canonical.type}</span>
            <span className="text-muted-foreground ml-1 text-xs">
              （{obj.canonical.label}）
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            方向：只读 inbound · 写回{" "}
            {binding.write_back.enabled ? "已启用" : "未启用"}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="border-border border-b px-4 py-3">
            <h3 className="text-sm font-semibold">字段映射</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AOL 字段</TableHead>
                <TableHead>业务系统路径</TableHead>
                <TableHead>转换</TableHead>
                <TableHead className="hidden md:table-cell">说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obj.fields.map((f) => (
                <TableRow key={f.to}>
                  <TableCell className="font-mono text-xs">{f.to}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {f.from ?? (f.paths ? f.paths.join(" | ") : "—")}
                  </TableCell>
                  <TableCell>
                    <TransformBadge op={f.op} />
                    {f.table ? (
                      <span className="text-muted-foreground ml-1 text-[10px]">
                        {f.table}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                    {f.description ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">状态码表</h3>
            <input
              placeholder="搜索码或标签…"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              className="border-input bg-background h-8 max-w-xs rounded-md border px-2 text-xs"
            />
          </div>
          <div className="max-h-48 overflow-auto rounded-md border">
            <Table>
              <TableBody>
                {filteredTaskEntries.map(([code, label]) => (
                  <TableRow key={code}>
                    <TableCell className="w-16 font-mono text-xs">{code}</TableCell>
                    <TableCell className="text-xs">{label}</TableCell>
                    <TableCell className="text-xs">
                      {eventTable[code] ? (
                        <span className="font-mono text-[10px]">
                          {eventTable[code]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <h3 className="text-sm font-semibold">事件规则</h3>
          <p className="text-muted-foreground text-xs">
            触发字段：{binding.event_rules?.trigger_field ?? "status"} ·
            当前摄取启用：
            {activeEventStatuses.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="ml-1 font-mono text-[10px]"
              >
                {s}={taskTable[s] ?? "?"}
              </Badge>
            ))}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(binding.event_rules?.labels ?? {}).map(
              ([key, label]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key} · {label}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">样例转换</h3>
              {sampleSource ? (
                <DataStateBadge
                  state={sampleSource === "mongo" ? "live" : "estimated"}
                  label={sampleSource === "mongo" ? "真实 Mongo" : "内置样例"}
                />
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={sampleBusy}
              onClick={runSample}
            >
              {sampleBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              <span className="ml-1">运行转换</span>
            </Button>
          </div>
          {sampleExternal && sampleCanonical ? (
            <div className="flex flex-col gap-3 lg:flex-row">
              <JsonBlock title="业务系统原始行" data={sampleExternal} />
              <JsonBlock title="AOL WorkOrder" data={sampleCanonical} />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              展示一条 serviceAppointment 如何翻译为 WorkOrder。已配置 Mongo
              时优先拉取真实记录。
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed opacity-70">
        <CardContent className="space-y-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">写回业务系统</h3>
            <DataStateBadge state="not_connected" label="未启用" />
          </div>
          <p className="text-muted-foreground text-xs">
            工单状态 / 上门备注写回规划在 v0.5+，当前 wedge 仅只读摄取。
          </p>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        领域语义说明见{" "}
        <Link
          href="https://github.com/franksunye/fs-aol/blob/main/docs/public/PUB-04-domain-semantics.md"
          className="text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          PUB-04 领域语义
        </Link>
      </p>
    </div>
  );
}
