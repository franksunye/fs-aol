import { Suspense } from "react";
import { cookies } from "next/headers";
import { CalendarView } from "@/components/action-center/calendar/calendar-view";
import { ActionCenterHeader } from "@/components/action-center/action-center-header";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { loadPilotHousekeepers } from "@/lib/pilot-housekeepers";
import { CALENDAR_SUBTITLE, CALENDAR_TITLE } from "@/lib/calendar-nav";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendarRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ hk?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;
  const pilots = loadPilotHousekeepers();

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-4 lg:px-4 lg:pt-5">
        <ActionCenterHeader
          pilots={pilots}
          hkFilter={hkFilter}
          compact
          title={CALENDAR_TITLE}
          subtitle={CALENDAR_SUBTITLE}
        />
      </div>
      <div className={cn(shellScrollClass, "min-h-0 flex-1 px-3 pb-4 lg:px-4")}>
        <Suspense fallback={null}>
          <CalendarView hkFilter={hkFilter} pilots={pilots} />
        </Suspense>
      </div>
    </main>
  );
}
