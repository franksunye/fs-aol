import { NextResponse } from "next/server";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export async function GET() {
  const snapshot = await getLatestEngineRuntimeSnapshot();
  if (!snapshot) {
    return NextResponse.json({ configured: false, snapshot: null });
  }
  return NextResponse.json({
    configured: true,
    runAt: snapshot.runAt,
    snapshot: snapshot.snapshot,
    runSummary: snapshot.runSummary,
  });
}
