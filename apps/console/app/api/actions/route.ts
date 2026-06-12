import { NextResponse } from "next/server";
import { listActions, mapActionsToExecution } from "@/lib/tracking/actions";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hk = url.searchParams.get("hk")?.trim() || undefined;
  const actions = await listActions({
    housekeeperId: hk,
    status: ["pending_dispatch", "in_progress"],
    limit: 200,
  });
  const items = await mapActionsToExecution(actions);
  return NextResponse.json({ items });
}
