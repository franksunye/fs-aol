import Link from "next/link";
import type { SensitiveFieldPolicy } from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaskingStrategyBadge } from "./governance-badges";

export function SensitiveFieldMaskingSection({
  policies,
}: {
  policies: SensitiveFieldPolicy[];
}) {
  return (
    <SettingsSectionCard title="敏感字段脱敏">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>字段</TableHead>
            <TableHead>所属资源</TableHead>
            <TableHead>脱敏策略</TableHead>
            <TableHead className="min-w-[10rem] whitespace-normal">
              可见角色
            </TableHead>
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
                    {policy.field}
                  </Link>
                ) : (
                  policy.field
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {policy.resource}
              </TableCell>
              <TableCell>
                <MaskingStrategyBadge strategy={policy.strategy} />
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-normal text-xs">
                {policy.visibleTo}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSectionCard>
  );
}
