import { NextResponse } from "next/server";
import { defaultRuntimeConfig } from "@/lib/runtime-config/defaults";
import {
  getRuntimeConfig,
  getRuntimeSecrets,
  mergeSecretsForTest,
} from "@/lib/runtime-config/store";
import { testLlmConnection } from "@/lib/runtime-config/test-connectors";
import type { RuntimeConfigJson, RuntimeSecrets } from "@/lib/runtime-config/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      config?: Partial<RuntimeConfigJson>;
      secrets?: Partial<RuntimeSecrets>;
    };
    const stored = await getRuntimeConfig();
    const config: RuntimeConfigJson = {
      ...(stored?.config ?? defaultRuntimeConfig()),
      ...body.config,
    };
    const secrets = mergeSecretsForTest(
      await getRuntimeSecrets(),
      body.secrets
    );
    const result = await testLlmConnection(config, secrets);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
