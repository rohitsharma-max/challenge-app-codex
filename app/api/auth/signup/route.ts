import { NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/store";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body ?? {};

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  try {
    const user = await createUser({ name, email, password });
    const token = await createSession(user.id);
    const response = NextResponse.json({ ok: true, user: { id: user.id, onboardingComplete: user.onboardingComplete } });
    return setSessionCookie(response, token);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signup failed" }, { status: 400 });
  }
}
