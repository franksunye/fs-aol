import { NextResponse } from "next/server";
import { authUser } from "@/lib/auth";
import {
  getRuntimeConfig,
  saveRuntimeConfig,
} from "@/lib/runtime-config/store";
import type { RuntimeConfigJson } from "@/lib/runtime-config/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await getRuntimeConfig();
  if (!row) {
    return NextResponse.json(
      { error: "Runtime config not initialized. Run migrate-env-to-runtime-config." },
      { status: 404 }
    );
  }
  return NextResponse.json(row);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      config?: Partial<RuntimeConfigJson>;
      changeSummary?: string;
    };
    const saved = await saveRuntimeConfig({
      config: body.config ?? {},
      updatedBy: authUser(),
      changeSummary: body.changeSummary,
    });
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }
}
