import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { restoreMissedStreak } from "@/lib/store";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await restoreMissedStreak(user.id);
    return NextResponse.json({
      ok: true,
      cost: result.cost,
      metrics: {
        streak: result.user.streak.current,
        bestStreak: result.user.streak.best,
        xp: result.user.xp
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Restore failed" }, { status: 400 });
  }
}
