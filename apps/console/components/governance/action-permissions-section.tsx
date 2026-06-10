import Link from "next/link";
import type { ActionPermissionPolicy } from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionExecutionModeBadge } from "./governance-badges";

export function ActionPermissionsSection({
  policies,
}: {
  policies: ActionPermissionPolicy[];
}) {
  return (
    <SettingsSectionCard title="可执行动作权限">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>动作类型</TableHead>
            <TableHead>范围</TableHead>
            <TableHead>允许角色</TableHead>
            <TableHead className="text-right">执行方式</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id}>
              <TableCell className="font-medium">
                {policy.href ? (
                  <Link
                    href={policy.href}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {policy.actionType}
                  </Link>
                ) : (
                  policy.actionType
                )}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-normal text-xs">
                {policy.scope}
              </TableCell>
              <TableCell className="whitespace-normal text-xs">
                {policy.allowedRoles}
              </TableCell>
              <TableCell className="text-right">
                <ActionExecutionModeBadge mode={policy.executionMode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSectionCard>
  );
}
