import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL, AT_COOKIE, RT_COOKIE } from "@/lib/api-config";

/**
 * Server-side helper for authed API calls from React Server Components.
 *
 * Why this exists alongside middleware.ts:
 * - middleware refreshes proactively when the access token is within 60s
 *   of expiry. That covers most cases but misses tokens that lapsed
 *   between the middleware run and a long-running RSC, or in any path
 *   the middleware matcher doesn't cover.
 * - When fetchers hit 401, returning null falls through to mock/empty
 *   states (e.g. April-mock dashboard cells) — bad UX for a "logged in"
 *   user. apiFetch() catches the 401 and retries once with a fresh AT.
 *
 * Cookie hygiene: RSC can read but cannot write cookies (Next 14 limit).
 * So when we refresh inline, the new AT is held in a per-request cache
 * and used for the rest of the render. The browser cookie gets updated
 * on the next request via the middleware (or via /auth/refresh proxy).
 *
 * Concurrency: React's `cache()` deduplicates calls within a single
 * request. If five components simultaneously trigger refresh, only one
 * actual /auth/refresh round-trip happens.
 */

type RefreshResult = {
  accessToken: string | null;
  /** Cached lifetime — informational only. */
  exp: number | null;
};

const NO_REFRESH: RefreshResult = { accessToken: null, exp: null };

/**
 * Returns the freshest access token available for this request:
 *   - existing AT cookie when not expired
 *   - newly obtained AT when expired and RT cookie is present
 *   - null when we couldn't get one (logged out or refresh failed)
 *
 * Cached per-request via React.cache so concurrent fetchers share one
 * refresh attempt.
 */
export const getFreshAccessToken = cache(async (): Promise<string | null> => {
  const at = cookies().get(AT_COOKIE)?.value;
  // Common path: token exists and isn't about to expire — just use it.
  if (at && !isExpiringSoon(at)) return at;
  // Fallback: try refresh. If no RT either, we're a true guest.
  const rt = cookies().get(RT_COOKIE)?.value;
  if (!rt) return at ?? null;
  const refreshed = await callRefresh(rt);
  return refreshed.accessToken ?? at ?? null;
});

/**
 * Authed server-side fetch wrapper. Adds Bearer + retries once on 401.
 * Returns the raw Response so callers keep their existing parsing logic;
 * returns null if the request couldn't be made at all (network error).
 */
export async function apiFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response | null> {
  const baseHeaders = new Headers(init.headers);
  baseHeaders.set("Accept", baseHeaders.get("Accept") ?? "application/json");

  const at = await getFreshAccessToken();
  if (at) baseHeaders.set("Authorization", `Bearer ${at}`);

  try {
    let res = await fetch(url, {
      ...init,
      headers: baseHeaders,
      cache: init.cache ?? "no-store",
    });

    if (res.status !== 401) return res;

    // 401 path — try one refresh-then-retry. If we already had a fresh AT
    // (from middleware), the server is telling us something else is wrong
    // (revoked token, role mismatch); don't loop, just return the 401.
    const rt = cookies().get(RT_COOKIE)?.value;
    if (!rt) return res;
    const refreshed = await callRefresh(rt);
    if (!refreshed.accessToken) return res;

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Accept", retryHeaders.get("Accept") ?? "application/json");
    retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
    res = await fetch(url, {
      ...init,
      headers: retryHeaders,
      cache: init.cache ?? "no-store",
    });
    return res;
  } catch {
    return null;
  }
}

/** Internal: call /auth/refresh. Memoised per request so concurrent
 *  fetchers only burn one API round-trip. */
const callRefresh = cache(async (refreshToken: string): Promise<RefreshResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return NO_REFRESH;
    const body = (await res.json()) as { accessToken?: string };
    if (!body.accessToken) return NO_REFRESH;
    return { accessToken: body.accessToken, exp: readExp(body.accessToken) };
  } catch {
    return NO_REFRESH;
  }
});

/** True when the JWT is missing exp, malformed, or expires within 30s. */
function isExpiringSoon(jwt: string): boolean {
  const exp = readExp(jwt);
  if (exp === null) return true;
  return exp * 1000 - Date.now() < 30 * 1000;
}

function readExp(jwt: string): number | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      Buffer.from(padded, "base64").toString("utf-8"),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}
