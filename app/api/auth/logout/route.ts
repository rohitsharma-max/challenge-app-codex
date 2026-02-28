import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionTokenFromCookies } from "@/lib/auth";
import { destroySession } from "@/lib/store";

export async function POST() {
  const token = await getSessionTokenFromCookies();
  await destroySession(token);
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
