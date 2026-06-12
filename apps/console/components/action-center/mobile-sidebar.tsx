"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  overviewBadge,
  closedCount,
  hk,
}: {
  activeCount: number;
  overviewBadge?: number;
  closedCount?: number;
  hk?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
            aria-expanded={open}
          />
        }
      >
        <Menu className="size-4" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-60 p-0 pt-[env(safe-area-inset-top)]"
        showCloseButton
      >
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        <SidebarNav
          activeCount={activeCount}
          overviewBadge={overviewBadge}
          closedCount={closedCount}
          hk={hk}
          collapsed={false}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
