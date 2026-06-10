"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataListFrame({
  toolbar,
  footer,
  children,
  className,
  viewportClassName,
}: {
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      <div
        className={cn(
          "shell-scroll min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]",
          viewportClassName
        )}
      >
        {children}
      </div>
      {footer ? (
        <footer className="bg-background z-10 shrink-0 border-t border-border">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
