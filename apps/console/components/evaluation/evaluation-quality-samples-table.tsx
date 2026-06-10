"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  evaluationRuleHref,
  evaluationSampleHref,
  QUALITY_SAMPLE_TAG_LABELS,
  type EvaluationQualitySample,
  type EvaluationQualitySampleTag,
} from "@/lib/evaluation-mock";
import {
  DataListColumnSettings,
  DataListDensityToggle,
  DataListFrame,
  DataListPagination,
  DataListStaticHead,
  DataListTable,
  DataListToolbar,
  EVALUATION_SAMPLES_COLUMN_PREFS,
  DATA_LIST_TABLE_IDS,
  paginateItems,
  useDataListColumnPreferences,
  useDataListDensity,
  useDataListUrlState,
} from "@/components/data-list";

const TAG_CLASSES: Record<EvaluationQualitySampleTag, string> = {
  false_positive: "border-red-200 bg-red-50 text-red-700",
  needs_edit: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-slate-200 bg-slate-50 text-slate-700",
  low_confidence: "border-violet-200 bg-violet-50 text-violet-800",
};

const SEVERITY_LABELS = { high: "高", medium: "中", low: "低" } as const;
const SEVERITY_CLASSES = {
  high: "text-red-600",
  medium: "text-amber-700",
  low: "text-muted-foreground",
} as const;

export function EvaluationQualitySamplesTable({
  samples,
  hk,
  resetDeps = [],
}: {
  samples: EvaluationQualitySample[];
  hk?: string;
  resetDeps?: readonly unknown[];
}) {
  const { density, setDensity } = useDataListDensity();
  const {
    hiddenIds,
    isColumnHidden,
    setColumnHidden,
    resetColumns,
  } = useDataListColumnPreferences(
    DATA_LIST_TABLE_IDS.evaluationSamples,
    EVALUATION_SAMPLES_COLUMN_PREFS
  );

  const { page, pageSize, setPage, setPageSize } = useDataListUrlState({
    scope: "quality",
    defaultSort: "latest",
    defaultPageSize: 10,
    parseSort: () => "latest",
    resetDeps,
  });

  const { pageItems, total, pageCount } = useMemo(
    () => paginateItems(samples, page, pageSize),
    [samples, page, pageSize]
  );

  const columns = useMemo<ColumnDef<EvaluationQualitySample, unknown>[]>(
    () => [
      {
        id: "time",
        header: () => <DataListStaticHead label="时间" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap tabular-nums">
            {row.original.time}
          </span>
        ),
      },
      {
        id: "agent",
        header: () => <DataListStaticHead label="Agent / Action" />,
        cell: ({ row }) => {
          const sample = row.original;
          return (
            <>
              <Link
                href={evaluationSampleHref(sample, hk)}
                className="hover:text-primary font-medium"
              >
                {sample.agentName}
                {sample.agentVersion ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    {sample.agentVersion}
                  </span>
                ) : null}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  / {sample.actionLabel}
                </span>
              </Link>
              {sample.ruleId ? (
                <div className="mt-1">
                  <Link
                    href={evaluationRuleHref(sample.ruleId, hk)}
                    className="text-muted-foreground hover:text-primary text-[10px]"
                  >
                    规则：{sample.ruleId}
                  </Link>
                </div>
              ) : null}
            </>
          );
        },
      },
      {
        id: "issue",
        header: () => <DataListStaticHead label="问题描述" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-[220px] leading-relaxed">
            {row.original.issue}
          </span>
        ),
      },
      {
        id: "suggestion",
        header: () => <DataListStaticHead label="建议处理" />,
        cell: ({ row }) => <span className="leading-relaxed">{row.original.suggestion}</span>,
      },
      {
        id: "severity",
        header: () => <DataListStaticHead label="严重度" />,
        cell: ({ row }) => (
          <span
            className={cn(
              "font-medium tabular-nums",
              SEVERITY_CLASSES[row.original.severity]
            )}
          >
            {SEVERITY_LABELS[row.original.severity]}
          </span>
        ),
      },
      {
        id: "tag",
        header: () => <DataListStaticHead label="标签" />,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              TAG_CLASSES[row.original.tag]
            )}
          >
            {QUALITY_SAMPLE_TAG_LABELS[row.original.tag]}
          </Badge>
        ),
      },
    ],
    [hk]
  );

  if (samples.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-xs">
        当前筛选下暂无样本
      </p>
    );
  }

  return (
    <DataListFrame
      className="min-h-[16rem]"
      toolbar={
        <DataListToolbar
          end={
            <>
              <DataListColumnSettings
                columns={EVALUATION_SAMPLES_COLUMN_PREFS}
                isColumnHidden={isColumnHidden}
                setColumnHidden={setColumnHidden}
                onReset={resetColumns}
              />
              <DataListDensityToggle
                density={density}
                onDensityChange={setDensity}
              />
            </>
          }
        />
      }
      footer={
        <DataListPagination
          page={page}
          pageSize={pageSize}
          total={total}
          pageCount={pageCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      }
    >
      <DataListTable
        data={pageItems}
        columns={columns}
        density={density}
        layout="wide"
        minWidth={720}
        stickyTitleColumn={false}
        userHiddenColumnIds={hiddenIds}
        tableClassName="text-xs"
        getRowId={(row) => `${row.time}-${row.agentName}-${row.actionLabel}`}
      />
    </DataListFrame>
  );
}
