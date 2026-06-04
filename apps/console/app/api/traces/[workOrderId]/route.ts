import { NextResponse } from "next/server";
import { getTrace, getTraceLite } from "@/lib/suggestions";

export async function GET(
  request: Request,
  context: { params: Promise<{ workOrderId: string }> }
) {
  const { workOrderId } = await context.params;
  const id = decodeURIComponent(workOrderId);
  const lite = new URL(request.url).searchParams.get("lite") === "1";
  const trace = lite ? await getTraceLite(id) : await getTrace(id);
  if (!trace) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(trace);
}
