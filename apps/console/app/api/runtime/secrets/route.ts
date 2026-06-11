import { NextResponse } from "next/server";
import { authUser } from "@/lib/auth";
import { saveRuntimeConfig } from "@/lib/runtime-config/store";
import type { RuntimeSecrets } from "@/lib/runtime-config/types";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      secrets?: Partial<RuntimeSecrets>;
      changeSummary?: string;
    };
    const saved = await saveRuntimeConfig({
      secrets: body.secrets ?? {},
      updatedBy: authUser(),
      changeSummary: body.changeSummary ?? "Secrets updated",
    });
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }
}
