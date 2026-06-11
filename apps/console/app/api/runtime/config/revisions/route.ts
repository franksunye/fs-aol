import { NextResponse } from "next/server";
import { listRuntimeConfigRevisions } from "@/lib/runtime-config/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const revisions = await listRuntimeConfigRevisions(undefined, limit);
  return NextResponse.json({ revisions });
}
