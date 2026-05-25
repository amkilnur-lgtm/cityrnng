import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";

export type EventInterest = {
  id: string;
  userId: string;
  eventKey: string;
  locationId: string;
  status: "going" | "cancelled";
  createdAt: string;
  cancelledAt: string | null;
};

/**
 * "Me" status for an event — going-interest (if RSVP'd) plus attendance
 * (if Strava already credited the run). Either can be null independently:
 * — RSVP'd but didn't run yet → interest!=null, attended=null
 * — Ran without RSVP-ing → interest=null, attended!=null
 * — Neither → API returns null, getMyEventStatus returns null too
 */
export type MyEventStatus = {
  interest: EventInterest | null;
  attended: { km: number | null; points: number | null } | null;
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

/**
 * Server-only — full "me" status for an event. Returns null when the user
 * has neither an active RSVP nor a credited attendance.
 */
export async function getMyEventStatus(
  eventKey: string,
): Promise<MyEventStatus | null> {
  const res = await apiFetch(
    `${API_BASE_URL}/events/${safeEventKey(eventKey)}/interest/me`,
  );
  if (!res || !res.ok) return null;
  return (await res.json()) as MyEventStatus | null;
}

/**
 * Convenience: returns just the going-interest, dropping attendance.
 * Existing call sites that only care about "is user RSVPed" keep working.
 */
export async function getMyInterest(
  eventKey: string,
): Promise<EventInterest | null> {
  const status = await getMyEventStatus(eventKey);
  if (!status?.interest) return null;
  return status.interest.status === "going" ? status.interest : null;
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
