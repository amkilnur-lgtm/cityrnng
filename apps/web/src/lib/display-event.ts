import { type ApiEvent, filterUpcoming, listPublicEvents } from "@/lib/api-events";
import { CLUB, type ClubDistance } from "@/lib/club";
import { LOCATIONS, NEXT_EVENT, type CityLocation } from "@/lib/home-mock";

/**
 * Display shape consumed by Hero/NextEvent/PersonalDashboard. Independent
 * of the mock vs API source — both feed it via converter helpers below.
 */
export type DisplayEvent = {
  id: string;
  dateBig: string;
  dayOfWeek: string;
  time: string;
  district: string;
  venue?: string;
  landmark?: string;
  distances: readonly ClubDistance[];
  typicalTurnout?: string;
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
  };
}

export function mockToDisplay(): DisplayEvent {
  const e = NEXT_EVENT;
  return {
    id: e.id,
    dateBig: e.dateBig,
    dayOfWeek: e.dayOfWeek,
    time: e.time,
    district: e.location.district,
    venue: e.location.venue,
    landmark: e.location.landmark,
    distances: e.distances,
    typicalTurnout: e.typicalTurnout,
  };
}

/**
 * Returns the closest upcoming event for hero/dashboard/next-event blocks.
 * Real API wins; mock is the last-resort fallback so the page never breaks.
 */
export async function getDisplayNextEvent(): Promise<DisplayEvent> {
  const upcoming = filterUpcoming(await listPublicEvents());
  if (upcoming.length > 0) return apiEventToDisplay(upcoming[0]);
  return mockToDisplay();
}
