import Link from "next/link";
import type { ApprovalMatrixRule } from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ApprovalMatrixSection({
  rules,
}: {
  rules: ApprovalMatrixRule[];
}) {
  return (
    <SettingsSectionCard title="人在回路审批矩阵">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>规则类型</TableHead>
            <TableHead>范围</TableHead>
            <TableHead>需要审批人</TableHead>
            <TableHead className="min-w-[14rem] whitespace-normal">
              条件说明
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">
                {rule.href ? (
                  <Link
                    href={rule.href}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {rule.ruleType}
                  </Link>
                ) : (
                  rule.ruleType
                )}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-normal">
                {rule.scope}
              </TableCell>
              <TableCell className="whitespace-normal">{rule.approvers}</TableCell>
              <TableCell className="text-muted-foreground whitespace-normal text-xs leading-relaxed">
                {rule.condition}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSectionCard>
  );
}
