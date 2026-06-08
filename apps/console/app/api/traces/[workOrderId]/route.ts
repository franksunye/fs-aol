import { NextResponse } from "next/server";
import { getTrace, getTraceLite, listTraces } from "@/lib/suggestions";

export async function GET(
  request: Request,
  context: { params: Promise<{ workOrderId: string }> }
) {
  const { workOrderId } = await context.params;
  const id = decodeURIComponent(workOrderId);
  const url = new URL(request.url);
  const lite = url.searchParams.get("lite") === "1";
  const all = url.searchParams.get("all") === "1";

  if (all) {
    const traces = await listTraces(id, { includePrompts: !lite });
    return NextResponse.json(traces);
  }

  const trace = lite ? await getTraceLite(id) : await getTrace(id);
  if (!trace) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(trace);
}
