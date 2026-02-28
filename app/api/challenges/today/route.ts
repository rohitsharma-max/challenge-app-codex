import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateTodayChallenge } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.onboardingComplete) {
    return NextResponse.json({ error: "Onboarding required" }, { status: 403 });
  }

  const { user: freshUser, todayRecord } = await getOrCreateTodayChallenge(user.id);

  return NextResponse.json({
    today: todayRecord,
    metrics: {
      streak: freshUser.streak.current,
      bestStreak: freshUser.streak.best,
      xp: freshUser.xp,
      restorableMissedDate: freshUser.streak.restorableMissedDate,
      restoreDeadline: freshUser.streak.restoreDeadline
    },
    profile: {
      name: freshUser.name,
      preferences: freshUser.preferences
    }
  });
}
