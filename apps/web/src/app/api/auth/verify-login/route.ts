import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  API_BASE_URL,
  AT_COOKIE,
  RT_COOKIE,
  SESSION_COOKIE_OPTS,
} from "@/lib/api-config";

/**
 * Proxy POST /auth/verify-login. On success, store tokens in httpOnly
 * cookies and return user — the client never sees the raw JWTs.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/verify-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(payload, { status: res.status });
  }

  const data = payload as {
    accessToken?: string;
    refreshToken?: string;
    user?: unknown;
  };

  if (data.accessToken && data.refreshToken) {
    const jar = cookies();
    // Cookie maxAge is just a backstop — actual session lifetime is
    // governed by the API's session row (expiresAt + status). Middleware
    // rotates the access token transparently when its JWT exp is near.
    const maxAge = 60 * 60 * 24 * 30;
    jar.set(AT_COOKIE, data.accessToken, { ...SESSION_COOKIE_OPTS, maxAge });
    jar.set(RT_COOKIE, data.refreshToken, { ...SESSION_COOKIE_OPTS, maxAge });
  }

  return NextResponse.json({ user: data.user ?? null });
}
