import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * Strava OAuth callback wrapper. Configure STRAVA_REDIRECT_URI on the
 * API to point here (e.g. https://cityrnng.ru/integrations/strava/callback).
 *
 * Flow:
 * 1. Strava → here with ?code=... or ?error=...
 * 2. We forward the same query to the API's public GET /integrations/strava/callback
 * 3. On success → redirect to /app/profile?strava=connected
 * 4. On error  → redirect to /app/profile?strava=error&reason=...
 *
 * The API route persists Strava tokens; we don't touch them here.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stravaError = url.searchParams.get("error");

  const profileUrl = new URL("/app/profile", url.origin);

  if (stravaError) {
    profileUrl.searchParams.set("strava", "error");
    profileUrl.searchParams.set("reason", stravaError);
    return NextResponse.redirect(profileUrl, { status: 303 });
  }

  if (!code || !state) {
    profileUrl.searchParams.set("strava", "error");
    profileUrl.searchParams.set("reason", "missing_code_or_state");
    return NextResponse.redirect(profileUrl, { status: 303 });
  }

  const apiUrl = new URL(`${API_BASE_URL}/integrations/strava/callback`);
  apiUrl.searchParams.set("code", code);
  apiUrl.searchParams.set("state", state);

  try {
    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { code?: string };
      profileUrl.searchParams.set("strava", "error");
      profileUrl.searchParams.set(
        "reason",
        body.code ?? `http_${res.status}`,
      );
      return NextResponse.redirect(profileUrl, { status: 303 });
    }
    profileUrl.searchParams.set("strava", "connected");
    return NextResponse.redirect(profileUrl, { status: 303 });
  } catch {
    profileUrl.searchParams.set("strava", "error");
    profileUrl.searchParams.set("reason", "network");
    return NextResponse.redirect(profileUrl, { status: 303 });
  }
}
