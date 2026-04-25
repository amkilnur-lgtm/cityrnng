import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type StravaStatus =
  | { connected: false }
  | {
      connected: true;
      providerUserId: string;
      scope: string;
      connectedAt: string;
      tokenExpiresAt: string | null;
    };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/** Server-side fetch of Strava connection status. Returns { connected: false } on any error. */
export async function getStravaStatus(): Promise<StravaStatus> {
  const headers = authHeaders();
  if (!headers) return { connected: false };
  try {
    const res = await fetch(`${API_BASE_URL}/integrations/strava/status`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return { connected: false };
    return (await res.json()) as StravaStatus;
  } catch {
    return { connected: false };
  }
}

/**
 * Get the Strava authorize URL. Used by the "Connect" server action —
 * the client redirects the browser to this URL.
 */
export async function getStravaAuthorizeUrl(): Promise<string | null> {
  const headers = authHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/integrations/strava/connect`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { authorizeUrl?: string };
    return data.authorizeUrl ?? null;
  } catch {
    return null;
  }
}

export async function disconnectStrava(): Promise<boolean> {
  const headers = authHeaders();
  if (!headers) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/integrations/strava/disconnect`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}
