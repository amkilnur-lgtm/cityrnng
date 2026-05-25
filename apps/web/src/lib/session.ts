import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";

export type AuthedUser = {
  id: string;
  email: string;
  status: string;
  roles: string[];
  profile: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    instagramHandle?: string | null;
    telegramHandle?: string | null;
  } | null;
};

/**
 * Server-side session read. Returns the current user or null if not
 * authenticated (no access token cookie or /me returns 401).
 *
 * Uses apiFetch so a stale access token triggers a one-shot refresh
 * instead of silently returning null — important for RSC routes where
 * a "logged out" return cascades into mock fallbacks.
 */
export async function getSession(): Promise<AuthedUser | null> {
  const res = await apiFetch(`${API_BASE_URL}/me`);
  if (!res || !res.ok) return null;
  return (await res.json()) as AuthedUser;
}
