import {
  type ApiEvent,
  type ApiEventType,
  type MaterializedApiEvent,
  filterUpcoming,
  listPublicEvents,
  listUpcomingEvents,
} from "@/lib/api-events";
import { getMyInterest } from "@/lib/api-event-interest";
import { CLUB, type ClubDistance } from "@/lib/club";
import {
  LOCATIONS,
  NEXT_EVENT,
  UPCOMING_EVENTS,
  type CityLocation,
} from "@/lib/home-mock";

/**
 * Display shape consumed by Hero/NextEvent/PersonalDashboard. Independent
 * of the mock vs API source — both feed it via converter helpers below.
 *
 * `locations` is the real list of starting points for THIS event (used by
 * NextEvent instead of the static club mock).
 */
export type DisplayEvent = {
  id: string;
  /** Event title — empty for default regular runs (UI shows generic
   *  "Сити Раннинг"); otherwise the human-readable name set by admin. */
  title: string;
  dateBig: string;
  dayOfWeek: string;
  time: string;
  district: string;
  venue?: string;
  landmark?: string;
  distances: readonly ClubDistance[];
  typicalTurnout?: string;
  type: ApiEventType;
  locations: Array<{ name: string; venue?: string }>;
};

const RU_MONTHS_SHORT = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];
const RU_WEEKDAYS_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Try to find a CityLocation from our LOCATIONS catalog by partial name match. */
function matchKnownLocation(name?: string | null): CityLocation | undefined {
  if (!name) return undefined;
  const needle = name.toLowerCase();
  return Object.values(LOCATIONS).find(
    (l) =>
      needle.includes(l.district.toLowerCase()) ||
      (l.venue && needle.includes(l.venue.toLowerCase())),
  );
}

export function materializedToDisplay(event: MaterializedApiEvent): DisplayEvent {
  const start = new Date(event.startsAt);
  const knownLoc = matchKnownLocation(
    event.locations[0]?.name ?? event.locationName ?? null,
  );
  const apiLoc = event.locations[0];
  const district =
    knownLoc?.district ??
    event.locationName ??
    apiLoc?.name ??
    "уточняется";
  const venue =
    knownLoc?.venue ?? apiLoc?.name ?? event.locationAddress ?? undefined;

  return {
    id: event.id,
    title: event.title || "",
    dateBig: String(start.getDate()).padStart(2, "0"),
    dayOfWeek: `${RU_WEEKDAYS_SHORT[start.getDay()]} · ${RU_MONTHS_SHORT[start.getMonth()]}`,
    time: fmtTime(start),
    district,
    venue,
    landmark: knownLoc?.landmark,
    distances: CLUB.distances,
    typicalTurnout: undefined,
    type: event.type,
    locations: event.locations.map((l) => ({
      name: matchKnownLocation(l.name)?.district ?? l.name,
      venue: matchKnownLocation(l.name)?.venue ?? l.name,
    })),
  };
}

export function apiEventToDisplay(event: ApiEvent): DisplayEvent {
  const start = new Date(event.startsAt);
  const knownLoc = matchKnownLocation(event.locationName);
  const apiLoc = event.syncRule?.locations[0];
  const district =
    knownLoc?.district ??
    event.locationName ??
    apiLoc?.name ??
    "уточняется";
  const venue =
    knownLoc?.venue ?? apiLoc?.name ?? event.locationAddress ?? undefined;

  return {
    id: event.id,
    title: event.title || "",
    dateBig: String(start.getDate()).padStart(2, "0"),
    dayOfWeek: `${RU_WEEKDAYS_SHORT[start.getDay()]} · ${RU_MONTHS_SHORT[start.getMonth()]}`,
    time: fmtTime(start),
    district,
    venue: venue ?? undefined,
    landmark: knownLoc?.landmark,
    // API doesn't carry distance options yet — fall back to CLUB defaults.
    distances: CLUB.distances,
    // No turnout signal on API yet — keep undefined; UI hides the line.
    typicalTurnout: undefined,
    type: event.type,
    locations:
      event.syncRule?.locations.map((l) => ({
        name: matchKnownLocation(l.name)?.district ?? l.name,
        venue: matchKnownLocation(l.name)?.venue ?? l.name,
      })) ?? [],
  };
}

export function mockToDisplay(): DisplayEvent {
  const e = NEXT_EVENT;
  return {
    id: e.id,
    title: e.title ?? "",
    dateBig: e.dateBig,
    dayOfWeek: e.dayOfWeek,
    time: e.time,
    district: e.location.district,
    venue: e.location.venue,
    landmark: e.location.landmark,
    distances: e.distances,
    typicalTurnout: e.typicalTurnout,
    type: e.type,
    locations: Object.values(LOCATIONS).map((l) => ({
      name: l.district,
      venue: l.venue,
    })),
  };
}

/**
 * Returns the closest upcoming event for hero/dashboard/next-event blocks.
 * Tries materialized endpoint first (rules + overrides + specials),
 * falls back to legacy /events list, then mock.
 */
export async function getDisplayNextEvent(): Promise<DisplayEvent> {
  const materialized = await listUpcomingEvents(2);
  if (materialized.length > 0) return materializedToDisplay(materialized[0]);

  const legacy = filterUpcoming(await listPublicEvents());
  if (legacy.length > 0) return apiEventToDisplay(legacy[0]);

  return mockToDisplay();
}

/**
 * Uniform list shape used by /events page. Both API materialized events
 * and mock fall back into this. `isRegular` controls badge styling.
 */
export type ListedEvent = {
  id: string;
  title: string;
  type: ApiEventType;
  startsAt: string;
  locationName: string | null;
  basePointsAward: number;
  isPointsEligible: boolean;
};

function defaultRegularTitle(): string {
  return "Сити Раннинг — пробежка";
}

/**
 * Compact row for the "Мои ближайшие записи" list on /app — joins each
 * upcoming event the user is RSVP'd to with its picked location's name.
 */
export type MyUpcomingRsvp = {
  eventKey: string;
  title: string;
  type: ApiEventType;
  startsAt: string;
  locationName: string;
};

export async function getMyUpcomingRsvps(weeks = 8): Promise<MyUpcomingRsvp[]> {
  const materialized = await listUpcomingEvents(weeks);
  // Fan out one /interest/me call per upcoming event. N is small (typically
  // 1–4 events visible inside the next 8 weeks), so a fancy backend join
  // isn't worth it yet.
  const rows = await Promise.all(
    materialized.map(async (m) => {
      const mine = await getMyInterest(m.id);
      if (!mine) return null;
      const loc = m.locations.find((l) => l.id === mine.locationId);
      return {
        eventKey: m.id,
        title:
          m.title ||
          (m.type === "regular" ? defaultRegularTitle() : "Спецсобытие"),
        type: m.type,
        startsAt: m.startsAt,
        locationName:
          matchKnownLocation(loc?.name)?.district ?? loc?.name ?? "—",
      } as MyUpcomingRsvp;
    }),
  );
  return rows.filter((r): r is MyUpcomingRsvp => r !== null);
}

export async function getDisplayUpcomingList(weeks = 8): Promise<ListedEvent[]> {
  const materialized = await listUpcomingEvents(weeks);
  if (materialized.length > 0) {
    return materialized.map((m) => ({
      id: m.id,
      title:
        m.title ||
        (m.type === "regular" ? defaultRegularTitle() : "Спецсобытие"),
      type: m.type,
      startsAt: m.startsAt,
      locationName: m.locations[0]?.name ?? m.locationName,
      basePointsAward: m.basePointsAward,
      isPointsEligible: m.isPointsEligible,
    }));
  }
  // Fallback to mock when API is unreachable or empty
  return UPCOMING_EVENTS.map((e) => ({
    id: e.id,
    title: e.title ?? defaultRegularTitle(),
    type: e.type,
    startsAt: e.startsAt,
    locationName: e.location.venue ?? e.location.district,
    basePointsAward: e.type === "regular" ? 30 : 50,
    isPointsEligible: true,
  }));
}
