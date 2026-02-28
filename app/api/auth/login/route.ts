import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/store";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await authenticate(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ ok: true, user: { id: user.id, onboardingComplete: user.onboardingComplete } });
  return setSessionCookie(response, token);
}
