import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

/** Active starting point the leader can scan at. */
export type LeaderLocation = {
  id: string;
  name: string;
  city: string;
  venue: string | null;
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/** Server-side fetch of the locations available to the leader. */
export async function listLeaderLocations(): Promise<LeaderLocation[]> {
  const headers = authHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/leader/locations`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) return [];
    return (await res.json()) as LeaderLocation[];
  } catch {
    return [];
  }
}
