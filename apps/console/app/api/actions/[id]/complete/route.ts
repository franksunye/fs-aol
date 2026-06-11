import { NextResponse } from "next/server";
import { completeAction } from "@/lib/tracking/actions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actionId = Number(id);
  if (!Number.isFinite(actionId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const body = (await req.json()) as {
    terminalFeedback?: string;
    operator?: string;
  };
  const feedback = body.terminalFeedback?.trim();
  if (!feedback) {
    return NextResponse.json(
      { error: "terminalFeedback required" },
      { status: 400 }
    );
  }
  await completeAction({
    actionId,
    terminalFeedback: feedback,
    operator: body.operator,
  });
  return NextResponse.json({ ok: true });
}
