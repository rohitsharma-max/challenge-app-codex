import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserPreferences } from "@/lib/store";
import { Category } from "@/types/app";

const validCategories: Category[] = ["Fitness", "Productivity", "Learning", "Fun", "Social"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const categories = Array.isArray(body?.categories)
    ? body.categories.filter((item: unknown): item is Category => validCategories.includes(item as Category))
    : [];
  const difficulty = body?.difficulty;
  const allowOutdoor = Boolean(body?.allowOutdoor);

  if (categories.length === 0 || !["Easy", "Medium", "Hard"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  }

  const updated = await setUserPreferences(user.id, { categories, difficulty, allowOutdoor });
  return NextResponse.json({ ok: true, onboardingComplete: updated.onboardingComplete });
}
