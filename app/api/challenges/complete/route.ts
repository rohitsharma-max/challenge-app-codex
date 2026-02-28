import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { completeTodayChallenge } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const proofNote = typeof body?.proofNote === "string" ? body.proofNote.trim() : undefined;

  try {
    const result = await completeTodayChallenge(user.id, proofNote);
    return NextResponse.json({
      ok: true,
      xpEarned: result.xpEarned,
      metrics: {
        streak: result.user.streak.current,
        bestStreak: result.user.streak.best,
        xp: result.user.xp
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }
}
