import { NextResponse } from "next/server";
import { mergeFsmLiveView } from "@/lib/integration-bindings";
import { getRuntimeConfig } from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [runtime, snapshot] = await Promise.all([
      getRuntimeConfig(),
      getLatestEngineRuntimeSnapshot(),
    ]);
    const view = mergeFsmLiveView(runtime, snapshot);
    return NextResponse.json(view);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
