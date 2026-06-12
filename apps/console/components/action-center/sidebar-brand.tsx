import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { OVERVIEW_HOME_PATH } from "@/lib/overview-nav";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PRODUCT_SUBTITLE = "Agent Ops";
const PRODUCT_SUBTITLE_HINT = "Agent Operations Layer";

export function SidebarBrand({
  collapsed = false,
  compact = false,
}: {
  collapsed?: boolean;
  compact?: boolean;
}) {
  const iconSize = compact ? "size-8" : "size-10";
  const letterSize = compact ? "text-sm" : "text-lg";

  const content = (
    <>
      <BrandMark className={iconSize} letterClassName={letterSize} />
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
          <div
            className="text-muted-foreground mt-1 truncate text-xs font-normal"
            title={PRODUCT_SUBTITLE_HINT}
          >
            {PRODUCT_SUBTITLE}
          </div>
        </div>
      ) : null}
    </>
  );

  const link = (
    <Link
      href={OVERVIEW_HOME_PATH}
      scroll={false}
      className={cn(
        "hover:opacity-90 flex min-w-0 items-center transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar rounded-lg",
        collapsed ? "justify-center" : "gap-3"
      )}
      aria-label={`Agent Console · ${PRODUCT_SUBTITLE}`}
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
          <span className="text-muted-foreground block text-xs">
            {PRODUCT_SUBTITLE}
          </span>
          <span className="text-muted-foreground/80 mt-0.5 block text-[10px]">
            {PRODUCT_SUBTITLE_HINT}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
