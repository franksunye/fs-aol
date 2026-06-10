import Link from "next/link";
import type {
  DataResourcePolicy,
  ModelAccessPolicy,
} from "@/lib/governance-mock";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccessLevelBadge } from "./governance-badges";

function PolicyTable({
  title,
  items,
  nameColumn,
}: {
  title: string;
  items: (DataResourcePolicy | ModelAccessPolicy)[];
  nameColumn: "resource" | "model";
}) {
  return (
    <SettingsSectionCard title={title} className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{nameColumn === "resource" ? "数据资源" : "模型"}</TableHead>
            <TableHead className="text-right">访问级别</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const name =
              nameColumn === "resource"
                ? (item as DataResourcePolicy).resource
                : (item as ModelAccessPolicy).model;
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      {name}
                    </Link>
                  ) : (
                    name
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AccessLevelBadge access={item.access} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SettingsSectionCard>
  );
}

export function AccessBoundariesSection({
  dataPolicies,
  modelPolicies,
}: {
  dataPolicies: DataResourcePolicy[];
  modelPolicies: ModelAccessPolicy[];
}) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PolicyTable
        title="数据资源访问策略"
        items={dataPolicies}
        nameColumn="resource"
      />
      <PolicyTable
        title="模型访问范围"
        items={modelPolicies}
        nameColumn="model"
      />
    </section>
  );
}
