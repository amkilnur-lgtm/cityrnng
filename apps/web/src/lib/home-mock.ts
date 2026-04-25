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
  session: {
    id: string;
    email: string;
    profile?: { displayName?: string | null } | null;
  } | null,
): SiteState {
  if (!session) return MOCK_GUEST;
  const displayName =
    session.profile?.displayName?.trim() || session.email.split("@")[0];
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
  centr: {
    slug: "centr",
    district: "Центр",
    venue: "Monkey Grinder, Карла Маркса 41",
    landmark: "Парк Якутова, Советская площадь, ул. Ленина",
  },
  prospekt: {
    slug: "prospekt",
    district: "Проспект",
    venue: "Monkey Grinder, Проспект Октября 63А",
    landmark: "Уфимское ожерелье, лес, смотровая на Белую",
  },
  chernikovka: {
    slug: "chernikovka",
    district: "Черниковка",
    venue: "Surf Coffee, Первомайская 22",
    landmark: "Парк Победы, парк Нефтехимиков, ул. Первомайская",
  },
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

/**
 * Partners catalog — mock of the future `partners` table (Epic 5).
 * Single source for /shop, /partners, ShopPreview.
 */
export type Partner = {
  slug: string;
  name: string;
  shortDescription: string;
  locations: string[];
};

export type PartnerSlug = "monkey-grinder" | "surf-coffee";

export const PARTNERS: Record<PartnerSlug, Partner> = {
  "monkey-grinder": {
    slug: "monkey-grinder",
    name: "Monkey Grinder",
    shortDescription:
      "Кофейня в&nbsp;Центре и&nbsp;на&nbsp;Проспекте — точки старта двух пробежек",
    locations: ["Карла Маркса 41", "Проспект Октября 63А"],
  },
  "surf-coffee": {
    slug: "surf-coffee",
    name: "Surf Coffee",
    shortDescription: "Кофейня в&nbsp;Черниковке — точка старта пробежки",
    locations: ["Первомайская 22"],
  },
};

export type Reward = {
  slug: string;
  partnerSlug: PartnerSlug;
  title: string;
  description?: string;
  costPoints: number;
  /** Optional badge text (e.g. "новинка", "до 31 мая"). */
  badge?: string;
};

export const REWARDS: Reward[] = [
  {
    slug: "mg-cappuccino",
    partnerSlug: "monkey-grinder",
    title: "Капучино",
    description: "200 мл, на любом молоке. Любая точка Monkey Grinder.",
    costPoints: 120,
  },
  {
    slug: "mg-croissant",
    partnerSlug: "monkey-grinder",
    title: "Круассан с миндалём",
    description: "Свежий, утром свежевыпеченный. Идёт с кофе.",
    costPoints: 180,
  },
  {
    slug: "mg-raf",
    partnerSlug: "monkey-grinder",
    title: "Раф ванильный",
    description: "Любимый напиток зимы. 300 мл.",
    costPoints: 160,
  },
  {
    slug: "mg-espresso",
    partnerSlug: "monkey-grinder",
    title: "Двойной эспрессо",
    description: "Ристретто или классика — на выбор.",
    costPoints: 80,
  },
  {
    slug: "sc-flat-white",
    partnerSlug: "surf-coffee",
    title: "Флэт уайт",
    description: "200 мл. Surf-blend, фирменная обжарка.",
    costPoints: 140,
  },
  {
    slug: "sc-matcha",
    partnerSlug: "surf-coffee",
    title: "Матча-латте",
    description: "Премиум матча из Удзи. На любом молоке.",
    costPoints: 120,
    badge: "до 31 мая",
  },
  {
    slug: "sc-cheesecake",
    partnerSlug: "surf-coffee",
    title: "Чизкейк Нью-Йорк",
    description: "Классический, в кофейню привозят утром.",
    costPoints: 220,
  },
  {
    slug: "sc-sandwich",
    partnerSlug: "surf-coffee",
    title: "Сэндвич с тунцом",
    description: "На цельнозерновом, идеально после 10 км.",
    costPoints: 260,
  },
];

export type RedemptionStatus = "active" | "used" | "expired" | "cancelled";

export type Redemption = {
  slug: string;
  rewardSlug: string;
  costPoints: number;
  status: RedemptionStatus;
  /** 6-char alphanumeric code, doubles as QR payload. */
  code: string;
  createdAt: string;
  expiresAt?: string;
  usedAt?: string;
};

export const MY_REDEMPTIONS: Redemption[] = [
  {
    slug: "r-001",
    rewardSlug: "mg-cappuccino",
    costPoints: 120,
    status: "active",
    code: "M4XKF7",
    createdAt: "2026-04-23T19:30:00.000Z",
    expiresAt: "2026-04-30T23:59:00.000Z",
  },
  {
    slug: "r-002",
    rewardSlug: "mg-espresso",
    costPoints: 80,
    status: "used",
    code: "M4WKG2",
    createdAt: "2026-04-15T19:35:00.000Z",
    usedAt: "2026-04-16T09:12:00.000Z",
  },
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
    date: "23 апр",
    title:
      "Книжный клуб в&nbsp;Monkey Grinder — обсуждаем «Бегущего за&nbsp;ветром»",
  },
  {
    id: "j2",
    eyebrow: "История",
    date: "16 апр",
    title: "Январский -25° — почему мы&nbsp;всё равно бежали",
  },
  {
    id: "j3",
    eyebrow: "Партнёр",
    date: "09 апр",
    title:
      "Surf Coffee добавляет матча-латте за&nbsp;120&nbsp;баллов до&nbsp;конца мая",
  },
];
