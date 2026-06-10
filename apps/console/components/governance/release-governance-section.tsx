"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReleaseEnvironment } from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function MockToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "bg-background size-4 rounded-full shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function ReleaseGovernanceSection({
  environments: initialEnvironments,
}: {
  environments: ReleaseEnvironment[];
}) {
  const [environments, setEnvironments] = useState(initialEnvironments);

  function updateRollback(id: string, rollbackEnabled: boolean) {
    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === id ? { ...env, rollbackEnabled } : env
      )
    );
  }

  return (
    <SettingsSectionCard title="配置发布治理">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>环境</TableHead>
            <TableHead>需要审批</TableHead>
            <TableHead>支持回滚</TableHead>
            <TableHead className="min-w-[16rem] whitespace-normal">
              发布检查清单
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {environments.map((env) => (
            <TableRow key={env.id}>
              <TableCell className="font-medium">{env.name}</TableCell>
              <TableCell>
                {env.requiresApproval ? (
                  <Badge className="border-violet-200 bg-violet-50 text-violet-700">
                    需要
                  </Badge>
                ) : (
                  <Badge variant="secondary">无需</Badge>
                )}
              </TableCell>
              <TableCell>
                <MockToggle
                  checked={env.rollbackEnabled}
                  onChange={(next) => updateRollback(env.id, next)}
                  label={`${env.name} 环境支持回滚`}
                />
              </TableCell>
              <TableCell>
                <ul className="space-y-1">
                  {env.checklist.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <CheckCircle2
                        className={cn(
                          "size-3.5 shrink-0",
                          item.passed
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                      <span
                        className={
                          item.passed
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSectionCard>
  );
}
