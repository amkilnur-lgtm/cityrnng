import { CLUB, pointsForDistance, type ClubDistance } from "@/lib/club";

export type GuestState = { isAuthed: false };
export type AuthedUser = { name: string; initial: string; points: number };
export type AuthedState = { isAuthed: true; user: AuthedUser };
export type SiteState = GuestState | AuthedState;

export const MOCK_GUEST: GuestState = { isAuthed: false };

export const MOCK_AUTHED: AuthedState = {
  isAuthed: true,
  user: { name: "Маша", initial: "М", points: 350 },
};

export function resolveSiteState(stateParam: string | undefined): SiteState {
  return stateParam === "authed" ? MOCK_AUTHED : MOCK_GUEST;
}

export function sessionToSiteState(
  session: { id: string; email: string; profile?: { displayName?: string | null } } | null,
): SiteState {
  if (!session) return MOCK_GUEST;
  const displayName = session.profile?.displayName?.trim() || session.email.split("@")[0];
  return {
    isAuthed: true,
    user: {
      name: displayName,
      initial: displayName.slice(0, 1).toUpperCase(),
      // points come from /points/balance fetch in Stage D — placeholder until then
      points: 0,
    },
  };
}

/**
 * City location — mock of what will come from `city_locations` table.
 * `venue` (точка старта) and `landmark` (ориентир) are optional:
 * filled via admin UI once Epic 6 ships.
 */
export type CityLocation = {
  slug: string;
  district: string;
  venue?: string;
  landmark?: string;
};

export type LocationSlug = "centr" | "prospekt" | "chernikovka";

export const LOCATIONS: Record<LocationSlug, CityLocation> = {
  centr: { slug: "centr", district: "Центр" },
  prospekt: { slug: "prospekt", district: "Проспект" },
  chernikovka: { slug: "chernikovka", district: "Черниковка" },
};

export type EventCard = {
  id: string;
  dateBig: string;
  dayOfWeek: string;
  location: CityLocation;
  time: string;
  distances: readonly ClubDistance[];
  /** Average turnout — no hard registration in MVP; this is social proof, not a limit. */
  typicalTurnout?: string;
};

export const UPCOMING_EVENTS: EventCard[] = [
  {
    id: "w-22",
    dateBig: "22",
    dayOfWeek: `${CLUB.runDayShort} · АПР`,
    location: LOCATIONS.centr,
    time: CLUB.runTime,
    distances: CLUB.distances,
    typicalTurnout: "12–15",
  },
  {
    id: "w-29",
    dateBig: "29",
    dayOfWeek: `${CLUB.runDayShort} · АПР`,
    location: LOCATIONS.prospekt,
    time: CLUB.runTime,
    distances: CLUB.distances,
    typicalTurnout: "10–14",
  },
  {
    id: "w-06",
    dateBig: "06",
    dayOfWeek: `${CLUB.runDayShort} · МАЙ`,
    location: LOCATIONS.chernikovka,
    time: CLUB.runTime,
    distances: CLUB.distances,
    typicalTurnout: "8–12",
  },
];

/** Closest upcoming event — single place for hero / dashboard "tomorrow". */
export const NEXT_EVENT = UPCOMING_EVENTS[0];

export type WeekCell = {
  date: string;
  weekday: typeof CLUB.runDayShort;
  kind: "done" | "skipped" | "tomorrow";
  km?: ClubDistance;
  points?: number;
  time?: string;
  place?: string;
};

export const WEEK_CELLS: WeekCell[] = [
  {
    date: "01 апр",
    weekday: CLUB.runDayShort,
    kind: "done",
    km: 5,
    points: pointsForDistance(5),
  },
  { date: "08 апр", weekday: CLUB.runDayShort, kind: "skipped" },
  {
    date: "15 апр",
    weekday: CLUB.runDayShort,
    kind: "done",
    km: 10,
    points: pointsForDistance(10),
  },
  {
    date: "22 апр",
    weekday: CLUB.runDayShort,
    kind: "tomorrow",
    time: CLUB.runTime,
    place: NEXT_EVENT.location.venue,
  },
];

/** Monthly km target = 3 "done" Wednesdays × max distance. */
export const MONTHLY_KM_TARGET = 3 * Math.max(...CLUB.distances);

export type ShopItem = {
  id: string;
  name: string;
  partner: string;
  price: number;
};

export const SHOP_PREVIEW: ShopItem[] = [
  { id: "coffee", name: "Капучино", partner: "у Маши · Хамовники", price: 120 },
  { id: "croissant", name: "Круассан", partner: "Цех 85 · Замоскворечье", price: 180 },
  { id: "brunch", name: "Бранч", partner: "Ферма · Пресня", price: 340 },
];

export type JournalPost = {
  id: string;
  eyebrow: "Анонс" | "История" | "Партнёр";
  date: string;
  title: string;
};

export const JOURNAL: JournalPost[] = [
  {
    id: "j1",
    eyebrow: "Анонс",
    date: "18 апр",
    title: "Следующая среда — Хамовники, 5 или&nbsp;10&nbsp;км от&nbsp;Парка культуры",
  },
  {
    id: "j2",
    eyebrow: "История",
    date: "12 апр",
    title: "Как соседи собрали 200 стартов за&nbsp;январь",
  },
  {
    id: "j3",
    eyebrow: "Партнёр",
    date: "05 апр",
    title: "«Цех 85» — круассан за&nbsp;180 баллов до&nbsp;конца мая",
  },
];
