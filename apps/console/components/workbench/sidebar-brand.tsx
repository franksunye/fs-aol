import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarBrand({
  collapsed = false,
  compact = false,
}: {
  collapsed?: boolean;
  compact?: boolean;
}) {
  const iconSize = compact ? "size-8" : "size-10";
  const sparkleSize = compact ? "size-4" : "size-5";

  const content = (
    <>
      <div
        className={cn(
          "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-xl shadow-sm",
          iconSize
        )}
      >
        <Sparkles className={sparkleSize} strokeWidth={2.25} aria-hidden />
      </div>
      {!collapsed ? (
        <div className="min-w-0 leading-none">
          <div
            className={cn(
              "text-foreground truncate font-bold tracking-tight",
              compact ? "text-sm" : "text-[15px]"
            )}
          >
            Agent Console
          </div>
          <div className="text-muted-foreground mt-1 truncate text-xs font-normal">
            FS-AOL
          </div>
        </div>
      ) : null}
    </>
  );

  const link = (
    <Link
      href="/"
      scroll={false}
      className={cn(
        "hover:opacity-90 flex min-w-0 items-center transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar rounded-lg",
        collapsed ? "justify-center" : "gap-3"
      )}
      aria-label="Agent Console · FS-AOL"
    >
      {content}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right" sideOffset={8}>
          Agent Console
          <span className="text-muted-foreground block text-xs">FS-AOL</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
