"use client";

import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataListColumnPreference } from "./use-data-list-column-preferences";

export function DataListColumnSettings({
  columns,
  isColumnHidden,
  setColumnHidden,
  onReset,
}: {
  columns: DataListColumnPreference[];
  isColumnHidden: (columnId: string) => boolean;
  setColumnHidden: (columnId: string, hidden: boolean) => void;
  onReset: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="size-7"
            aria-label="列设置"
            title="列设置"
          />
        }
      >
        <Columns3 className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs">显示列</DropdownMenuLabel>
          {columns.map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={!isColumnHidden(col.id)}
              onCheckedChange={(checked) => setColumnHidden(col.id, !checked)}
            >
              {col.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground text-xs"
          onClick={onReset}
        >
          恢复默认
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
