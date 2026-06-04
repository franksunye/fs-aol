import { NextResponse } from "next/server";
import { getTimelineEvents } from "@/lib/timeline";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workOrderId: string }> }
) {
  const { workOrderId } = await context.params;
  const id = decodeURIComponent(workOrderId);
  const events = await getTimelineEvents(id);
  return NextResponse.json({ events });
}
