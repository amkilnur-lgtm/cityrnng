/**
 * Canonical facts about CITYRNNG club — single source of truth for
 * components and mock data. When product changes (e.g. new distances,
 * different time), update here only.
 */
export const CLUB = {
  name: "Ситираннинг",
  /** Nominative — "Уфа". */
  city: "Уфа",
  /** Genitive — "районы Уфы". */
  cityGenitive: "Уфы",
  foundedYear: 2023,
  founders: ["Константин Летинский", "Кирилл Федотов"],
  runDayShort: "СР",
  runDayLong: "среда",
  runTime: "19:30",
  /** Two route options offered at every event — runner picks on the day. */
  distances: [5, 10] as const,
  /** 1 km of run = this many points, rounded to nearest 10 for display. */
  pointsPerKm: 6,
  /** Email & social — used in footer / about / contact CTAs. */
  contacts: {
    email: "hello@cityrnng.ru",
    partnersEmail: "partners@cityrnng.ru",
    telegram: "https://t.me/cityrnng",
    instagram: "https://instagram.com/cityrnng",
  },
} as const;

export type ClubDistance = (typeof CLUB.distances)[number];

/** Human-readable "5 или 10 км". */
export const DISTANCE_RANGE = `${CLUB.distances.join(" или ")} км`;

/** Points earned for completing a given distance. */
export function pointsForDistance(km: ClubDistance): number {
  return km * CLUB.pointsPerKm;
}
