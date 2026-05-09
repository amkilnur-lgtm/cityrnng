import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_BASE_URL, AT_COOKIE, RT_COOKIE, SESSION_COOKIE_OPTS } from "@/lib/api-config";

const REFRESH_GRACE_SEC = 60;
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days — actual lifetime is governed by API session.expiresAt

/**
 * Server-side access-token rotation. Runs before every matched request.
 * If the access cookie is missing or about to expire and a refresh cookie
 * is present, we exchange it for a fresh pair via the API and rewrite the
 * cookies on both the request (so server components see the new token)
 * and the response (so the browser stores them).
 */
export async function middleware(req: NextRequest) {
  const at = req.cookies.get(AT_COOKIE)?.value;
  const rt = req.cookies.get(RT_COOKIE)?.value;

  if (!rt) return NextResponse.next();
  if (at && !isExpiringSoon(at)) return NextResponse.next();

  try {
    const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
      cache: "no-store",
    });

    if (!resp.ok) {
      // Refresh failed — likely revoked/expired. Clear cookies so the
      // user lands as a guest instead of looping with a dead token.
      const cleared = NextResponse.next();
      cleared.cookies.delete(AT_COOKIE);
      cleared.cookies.delete(RT_COOKIE);
      return cleared;
    }

    const data = (await resp.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!data.accessToken || !data.refreshToken) return NextResponse.next();

    // Forward the new access token to the downstream handler in this same
    // request, otherwise getSession() would still read the stale cookie.
    const headers = new Headers(req.headers);
    const newCookieHeader = rebuildCookieHeader(req.headers.get("cookie"), {
      [AT_COOKIE]: data.accessToken,
      [RT_COOKIE]: data.refreshToken,
    });
    if (newCookieHeader !== null) headers.set("cookie", newCookieHeader);

    const next = NextResponse.next({ request: { headers } });
    next.cookies.set(AT_COOKIE, data.accessToken, {
      ...SESSION_COOKIE_OPTS,
      maxAge: COOKIE_MAX_AGE_SEC,
    });
    next.cookies.set(RT_COOKIE, data.refreshToken, {
      ...SESSION_COOKIE_OPTS,
      maxAge: COOKIE_MAX_AGE_SEC,
    });
    return next;
  } catch {
    return NextResponse.next();
  }
}

function isExpiringSoon(jwt: string): boolean {
  try {
    const [, payloadB64] = jwt.split(".");
    if (!payloadB64) return true;
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 - Date.now() < REFRESH_GRACE_SEC * 1000;
  } catch {
    return true;
  }
}

function rebuildCookieHeader(
  raw: string | null,
  overrides: Record<string, string>,
): string | null {
  if (!raw) {
    return Object.entries(overrides)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  const parts = raw.split(/;\s*/).filter(Boolean);
  const seen = new Set<string>();
  const next = parts.map((p) => {
    const eq = p.indexOf("=");
    const name = eq === -1 ? p : p.slice(0, eq);
    if (overrides[name] !== undefined) {
      seen.add(name);
      return `${name}=${overrides[name]}`;
    }
    return p;
  });
  for (const [name, val] of Object.entries(overrides)) {
    if (!seen.has(name)) next.push(`${name}=${val}`);
  }
  return next.join("; ");
}

export const config = {
  // Skip Next internals, static assets, and the refresh/logout proxy
  // routes themselves (refresh would loop, logout intentionally clears
  // cookies and we don't want to refresh them back).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|api/auth/refresh|api/auth/logout|monitoring).*)",
  ],
};
