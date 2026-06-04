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
    email: "cityrnng@yandex.com",
    partnersEmail: "cityrnng@yandex.com",
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

/**
 * Сколько сред прошло с момента основания клуба (первая среда 2023 года —
 * 4 января 2023) по сегодня включительно. Используется в hero на главной
 * для счётчика «N пробежек проведено». Растёт ровно по календарю,
 * раз в неделю, без зависимости от данных в БД.
 */
export function wednesdaysSinceFounding(now: Date = new Date()): number {
  // First Wednesday of 2023 (founding year): January 4.
  const start = Date.UTC(CLUB.foundedYear, 0, 4);
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // Snap today back to the most recent Wednesday (≤ today).
  const today = new Date(todayUtc);
  const dow = today.getUTCDay(); // Sun=0, Wed=3, Sat=6
  const daysBack = dow >= 3 ? dow - 3 : dow + 4;
  const lastWed = todayUtc - daysBack * 24 * 60 * 60 * 1000;
  if (lastWed < start) return 0;
  const diffDays = Math.round((lastWed - start) / (24 * 60 * 60 * 1000));
  return Math.floor(diffDays / 7) + 1;
}
