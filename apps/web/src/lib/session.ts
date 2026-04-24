import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type AuthedUser = {
  id: string;
  email: string;
  roles: string[];
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
  };
};

/**
 * Server-side session read. Returns the current user or null if not
 * authenticated (no access token cookie or /me returns 401).
 */
export async function getSession(): Promise<AuthedUser | null> {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthedUser;
  } catch {
    return null;
  }
}
