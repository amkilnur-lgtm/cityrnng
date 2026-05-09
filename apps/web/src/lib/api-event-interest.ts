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

/**
 * Next 14's App Router hands route params back still percent-encoded for
 * reserved chars like `:` (so `rule:UUID:DATE` arrives as `rule%3AUUID%3ADATE`).
 * Naively `encodeURIComponent`-ing again would double-encode (`%3A` → `%253A`)
 * and the API regex wouldn't match — returning 404 and leaving the user's
 * RSVP invisible. Decode-then-encode normalises both already-encoded params
 * and clean strings (e.g. ids returned by listUpcomingEvents) into a single
 * encoding pass.
 */
function safeEventKey(eventKey: string): string {
  return encodeURIComponent(decodeURIComponent(eventKey));
}

/** Server-only — checks if the current user has an active RSVP for the event. */
export async function getMyInterest(
  eventKey: string,
): Promise<EventInterest | null> {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/events/${safeEventKey(eventKey)}/interest/me`,
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
      `${API_BASE_URL}/events/${safeEventKey(eventKey)}/interest/counts`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return (await res.json()) as LocationCount[];
  } catch {
    return [];
  }
}
