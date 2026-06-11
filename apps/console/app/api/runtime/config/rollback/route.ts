import { NextResponse } from "next/server";
import { authUser } from "@/lib/auth";
import { rollbackRuntimeConfig } from "@/lib/runtime-config/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { version?: number };
    if (!body.version || body.version < 1) {
      return NextResponse.json({ error: "version required" }, { status: 400 });
    }
    const saved = await rollbackRuntimeConfig(body.version, authUser());
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }
}
