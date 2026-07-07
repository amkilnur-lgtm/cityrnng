import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  API_BASE_URL,
  AT_COOKIE,
  RT_COOKIE,
  SESSION_COOKIE_OPTS,
} from "@/lib/api-config";

/**
 * Proxy an auth endpoint that returns { accessToken, refreshToken, user }.
 * On success, store the tokens in httpOnly cookies (same session the magic
 * link uses) and return { user }. Shared by /api/auth/login + /register so the
 * whole flow stays in the same browser tab — no email round-trip.
 */
export async function proxyAuthAndSetSession(
  req: Request,
  upstreamPath: string,
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_BASE_URL}${upstreamPath}`, {
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
    const maxAge = 60 * 60 * 24 * 30; // backstop; API session governs real lifetime
    jar.set(AT_COOKIE, data.accessToken, { ...SESSION_COOKIE_OPTS, maxAge });
    jar.set(RT_COOKIE, data.refreshToken, { ...SESSION_COOKIE_OPTS, maxAge });
  }

  return NextResponse.json({ user: data.user ?? null });
}
