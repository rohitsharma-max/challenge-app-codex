import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserBySession } from "@/lib/store";

const SESSION_COOKIE = "daily_ai_session";

export function getSessionTokenFromCookies(): Promise<string | undefined> {
  return cookies().then((c) => c.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const token = await getSessionTokenFromCookies();
  return await getUserBySession(token);
}

export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
  return response;
}
