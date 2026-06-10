import Link from "next/link";
import {
  GOVERNANCE_MODULE_LABELS,
  GOVERNANCE_MODULE_ORDER,
  governanceModuleHref,
} from "@/lib/governance-nav";
import type { GovernanceRole } from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionBadge } from "./governance-badges";

export function RolesPermissionsSection({
  roles,
  hk,
}: {
  roles: GovernanceRole[];
  hk?: string;
}) {
  return (
    <SettingsSectionCard title="角色与权限">
      <div className="-mx-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[7rem]">角色</TableHead>
              {GOVERNANCE_MODULE_ORDER.map((module) => (
                <TableHead key={module} className="min-w-[5.5rem] text-center">
                  <Link
                    href={governanceModuleHref(module, hk)}
                    className="text-foreground hover:text-primary inline-block transition-colors"
                  >
                    {GOVERNANCE_MODULE_LABELS[module]}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                {GOVERNANCE_MODULE_ORDER.map((module) => {
                  const perms = role.permissions[module] ?? [];
                  return (
                    <TableCell key={module} className="text-center">
                      {perms.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {perms.map((perm) => (
                            <PermissionBadge key={perm} permission={perm} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SettingsSectionCard>
  );
}
