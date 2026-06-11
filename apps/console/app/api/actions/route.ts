import { NextResponse } from "next/server";
import { listActions, mapActionToExecution } from "@/lib/tracking/actions";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hk = url.searchParams.get("hk")?.trim() || undefined;
  const actions = await listActions({
    housekeeperId: hk,
    status: ["pending_dispatch", "in_progress"],
    limit: 200,
  });
  const items = await Promise.all(actions.map(mapActionToExecution));
  return NextResponse.json({ items });
}
