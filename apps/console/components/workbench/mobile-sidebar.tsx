"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function MobileSidebar({
  activeCount,
  closedCount,
  hk,
}: {
  activeCount: number;
  closedCount?: number;
  hk?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="md:hidden"
            aria-label="打开导航菜单"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0" showCloseButton>
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        <div onClick={() => setOpen(false)} onKeyDown={() => setOpen(false)}>
          <SidebarNav
            activeCount={activeCount}
            closedCount={closedCount}
            hk={hk}
            collapsed={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
