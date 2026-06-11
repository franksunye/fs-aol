import { NextResponse } from "next/server";
import type { ActionStatus } from "@/lib/tracking/types";
import { transitionAction } from "@/lib/tracking/actions";

const ALLOWED: ActionStatus[] = [
  "in_progress",
  "rejected",
  "timeout",
  "no_feedback",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actionId = Number(id);
  if (!Number.isFinite(actionId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const body = (await req.json()) as { status?: ActionStatus; operator?: string };
  if (!body.status || !ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  await transitionAction({
    actionId,
    status: body.status,
    operator: body.operator,
  });
  return NextResponse.json({ ok: true });
}
