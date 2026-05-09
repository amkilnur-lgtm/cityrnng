import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type EventInterest = {
  id: string;
  userId: string;
  eventKey: string;
  locationId: string;
  status: "going" | "cancelled";
  createdAt: string;
  cancelledAt: string | null;
};

export type LocationCount = {
  locationId: string;
  count: number;
};

/** Server-only — checks if the current user has an active RSVP for the event. */
export async function getMyInterest(
  eventKey: string,
): Promise<EventInterest | null> {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/events/${encodeURIComponent(eventKey)}/interest/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as EventInterest | null;
    return body && body.status === "going" ? body : null;
  } catch {
    return null;
  }
}

/** Public — counts of "going" RSVPs grouped by location. */
export async function getInterestCounts(
  eventKey: string,
): Promise<LocationCount[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/events/${encodeURIComponent(eventKey)}/interest/counts`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return (await res.json()) as LocationCount[];
  } catch {
    return [];
  }
}
