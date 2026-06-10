import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SettingsSectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-5 py-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className={cn("px-5 py-4", bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
