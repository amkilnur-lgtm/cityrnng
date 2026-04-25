import { API_BASE_URL } from "@/lib/api-config";

/** Event type — narrowed enum that mirrors API's EventType. */
export type ApiEventType = "regular" | "special" | "partner";

/** Shape returned by GET /events and GET /events/:id — mirrors mapEventPublic in apps/api/src/events/events.service.ts. */
export type ApiEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: ApiEventType;
  status: string;
  startsAt: string;
  endsAt: string;
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  capacity: number | null;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  isPointsEligible: boolean;
  basePointsAward: number;
  syncRule: {
    locations: Array<{
      id: string;
      name: string;
      city: string;
      lat: number | string | null;
      lng: number | string | null;
      radiusMeters: number | null;
    }>;
  } | null;
};

/** Materialized occurrence — recurring rule rendered, or explicit standalone event. */
export type MaterializedApiEvent = {
  id: string;
  isMaterialized: boolean;
  title: string;
  type: ApiEventType;
  status: string;
  startsAt: string;
  endsAt: string;
  isPointsEligible: boolean;
  basePointsAward: number;
  description: string | null;
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  capacity: number | null;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  recurrenceRuleId: string | null;
  overridesOccurrenceAt: string | null;
  locations: Array<{
    id: string;
    name: string;
    city: string;
    lat: number | string | null;
    lng: number | string | null;
  }>;
};

export type ListEventsQuery = {
  status?: string;
  type?: string;
  from?: string;
  to?: string;
};

/**
 * Materialized upcoming list — recurring rules + explicit specials,
 * already sorted by startsAt asc. Use this on the public /events page
 * and the home next-event card.
 */
export async function listUpcomingEvents(weeks = 8): Promise<MaterializedApiEvent[]> {
  const url = new URL(`${API_BASE_URL}/events/upcoming`);
  url.searchParams.set("weeks", String(weeks));
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as MaterializedApiEvent[];
  } catch {
    return [];
  }
}

export async function listPublicEvents(query: ListEventsQuery = {}): Promise<
  ApiEvent[]
> {
  const url = new URL(`${API_BASE_URL}/events`);
  for (const [k, v] of Object.entries(query)) {
    if (v != null) url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ApiEvent[];
  } catch {
    return [];
  }
}

export async function getPublicEvent(id: string): Promise<ApiEvent | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ApiEvent;
  } catch {
    return null;
  }
}

/** Return only events that start in the future, sorted ascending. */
export function filterUpcoming(events: ApiEvent[]): ApiEvent[] {
  const now = Date.now();
  return events
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}
