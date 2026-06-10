"use client";

import { AlignJustify, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataListDensity } from "./data-list-types";

export function DataListDensityToggle({
  density,
  onDensityChange,
  className,
}: {
  density: DataListDensity;
  onDensityChange: (density: DataListDensity) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex rounded-md border border-border p-0.5", className)}
      role="group"
      aria-label="列表密度"
    >
      <Button
        type="button"
        variant={density === "comfortable" ? "secondary" : "ghost"}
        size="icon-xs"
        className="size-7"
        aria-pressed={density === "comfortable"}
        title="标准行高"
        onClick={() => onDensityChange("comfortable")}
      >
        <Rows3 className="size-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant={density === "compact" ? "secondary" : "ghost"}
        size="icon-xs"
        className="size-7"
        aria-pressed={density === "compact"}
        title="紧凑行高"
        onClick={() => onDensityChange("compact")}
      >
        <AlignJustify className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
