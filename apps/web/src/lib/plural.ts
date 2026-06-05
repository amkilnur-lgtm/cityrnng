/**
 * Русская плюрализация: возвращает нужную форму существительного
 * по числовому контексту.
 *
 * - one  — 1, 21, 31, … (но не 11)
 * - few  — 2-4, 22-24, …
 * - many — 0, 5-20, 25-30, …
 *
 * Примеры:
 *   pluralRu(0, "локация", "локации", "локаций")  → "локаций"
 *   pluralRu(1, …)                                → "локация"
 *   pluralRu(2, …)                                → "локации"
 *   pluralRu(11, …)                               → "локаций"
 *   pluralRu(21, …)                               → "локация"
 */
export function pluralRu(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const abs = Math.abs(n) | 0;
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
