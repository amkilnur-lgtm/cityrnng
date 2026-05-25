import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";

export type StravaStatus =
  | { connected: false }
  | {
      connected: true;
      providerUserId: string;
      scope: string;
      connectedAt: string;
      tokenExpiresAt: string | null;
    };

/** Server-side fetch of Strava connection status. Returns { connected: false } on any error. */
export async function getStravaStatus(): Promise<StravaStatus> {
  const res = await apiFetch(`${API_BASE_URL}/integrations/strava/status`);
  if (!res || !res.ok) return { connected: false };
  return (await res.json()) as StravaStatus;
}

/**
 * Get the Strava authorize URL. Used by the "Connect" server action —
 * the client redirects the browser to this URL.
 */
export async function getStravaAuthorizeUrl(): Promise<string | null> {
  const res = await apiFetch(`${API_BASE_URL}/integrations/strava/connect`);
  if (!res || !res.ok) return null;
  const data = (await res.json()) as { authorizeUrl?: string };
  return data.authorizeUrl ?? null;
}

export async function disconnectStrava(): Promise<boolean> {
  const res = await apiFetch(`${API_BASE_URL}/integrations/strava/disconnect`, {
    method: "DELETE",
  });
  return !!res && res.ok;
}

export type StravaSyncResult = {
  ingestion: { fetched: number; upserted: number; pages: number };
  matching: {
    activitiesEvaluated: number;
    rulesConsidered: number;
    candidatesAttempted: number;
    attendancesCreated: number;
    awardsPosted: number;
  };
};

/** User-triggered manual sync. Backend bounds the window to max(connectedAt, now-30d). */
export async function syncStrava(): Promise<StravaSyncResult | null> {
  const res = await apiFetch(`${API_BASE_URL}/integrations/strava/sync`, {
    method: "POST",
  });
  if (!res || !res.ok) return null;
  return (await res.json()) as StravaSyncResult;
}
