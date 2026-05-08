import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, AT_COOKIE, RT_COOKIE, SESSION_COOKIE_OPTS } from "@/lib/api-config";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

/**
 * Manual refresh endpoint. Reads the rt cookie, swaps it via the API,
 * and rewrites both cookies. Mostly a fallback for client-side flows —
 * server-side rotation is handled transparently by middleware.
 */
export async function POST() {
  const jar = cookies();
  const refreshToken = jar.get(RT_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { code: "AUTH_INVALID_REFRESH" },
      { status: 401 },
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    jar.delete(AT_COOKIE);
    jar.delete(RT_COOKIE);
    const payload = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    user?: unknown;
  };

  jar.set(AT_COOKIE, data.accessToken, {
    ...SESSION_COOKIE_OPTS,
    maxAge: COOKIE_MAX_AGE_SEC,
  });
  jar.set(RT_COOKIE, data.refreshToken, {
    ...SESSION_COOKIE_OPTS,
    maxAge: COOKIE_MAX_AGE_SEC,
  });

  return NextResponse.json({ user: data.user ?? null });
}
