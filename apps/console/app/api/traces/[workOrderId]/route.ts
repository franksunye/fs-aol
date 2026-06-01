import { NextResponse } from "next/server";
import { getTraceLite } from "@/lib/suggestions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workOrderId: string }> }
) {
  const { workOrderId } = await context.params;
  const id = decodeURIComponent(workOrderId);
  const trace = await getTraceLite(id);
  if (!trace) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(trace);
}
