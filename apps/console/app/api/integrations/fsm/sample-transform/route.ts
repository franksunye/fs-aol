import { NextResponse } from "next/server";
import { runSampleTransform } from "@/lib/integration-bindings/sample-transform";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runSampleTransform();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
