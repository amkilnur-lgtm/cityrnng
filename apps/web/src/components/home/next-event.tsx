import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import { CLUB } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";

function pluralLocations(n: number): string {
  // Russian plural for "локация" — 1 локация / 2-4 локации / 5+ локаций
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "локаций";
  if (mod10 === 1) return "локация";
  if (mod10 >= 2 && mod10 <= 4) return "локации";
  return "локаций";
}

export function NextEvent({
  event,
  isAuthed = false,
}: {
  event: DisplayEvent;
  isAuthed?: boolean;
}) {
  const e = event;
  const locations =
    e.locations.length > 0
      ? e.locations
      : [{ name: e.district, venue: e.venue ?? "место уточняется" }];

  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="type-mono-caps">ближайшее событие</span>
              {e.type === "special" ? <Badge variant="primary">Спец</Badge> : null}
              {e.type === "partner" ? <Badge variant="soft">Партнёр</Badge> : null}
            </div>
            <h2 className="type-h2">
              {e.type === "special" ? (
                e.title ? (
                  <em className="not-italic text-brand-red">{e.title}</em>
                ) : (
                  <>Спецсобытие.</>
                )
              ) : e.type === "partner" ? (
                e.title ? (
                  <em className="not-italic text-brand-red">{e.title}</em>
                ) : (
                  <>Партнёрское событие.</>
                )
              ) : (
                <em className="not-italic text-brand-red">{CLUB.name}</em>
              )}
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Все события →
          </Link>
        </div>

        <article className="grid grid-cols-1 border border-ink lg:grid-cols-[280px_1fr_auto]">
          <div className="flex flex-col gap-1 border-b border-ink bg-paper-2 p-6 md:p-8 lg:border-b-0 lg:border-r">
            <span className="type-mono-caps">{e.dayOfWeek}</span>
            <span className="font-display text-[96px] font-bold leading-[0.85] tracking-[-0.04em] text-ink">
              {e.dateBig}
            </span>
            <span className="mt-2 font-mono text-[13px] font-medium tracking-[0.04em] text-ink">
              {e.time}
            </span>
          </div>

          <div className="flex flex-col gap-4 border-b border-ink p-6 md:p-8 lg:border-b-0 lg:border-r">
            <h3 className="font-display text-[32px] font-bold leading-none tracking-[-0.02em] text-ink md:text-[40px]">
              {locations.length === 1
                ? "Точка старта"
                : `${locations.length} ${pluralLocations(locations.length)} на выбор`}
            </h3>
            <ul className="flex flex-col">
              {locations.map((loc, idx) => (
                <li
                  key={`${loc.name}-${idx}`}
                  className="grid grid-cols-[120px_1fr] items-baseline gap-3 border-b border-ink/15 py-2.5 text-[14px] last:border-b-0 md:grid-cols-[160px_1fr]"
                >
                  <span className="font-semibold text-ink">{loc.name}</span>
                  <span className="text-graphite">
                    {loc.venue ?? "место уточняется"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              {e.distances.map((d) => (
                <span
                  key={d}
                  className="inline-flex h-8 items-center border border-ink bg-paper px-3 font-mono text-[13px] font-medium tracking-[0.04em] text-ink"
                >
                  {d}&nbsp;км
                </span>
              ))}
              <span className="inline-flex h-8 items-center border border-ink/30 px-3 font-mono text-[13px] font-medium tracking-[0.04em] text-muted">
                {e.time}
              </span>
            </div>
          </div>

          <div className="flex flex-col bg-paper">
            <Link
              href={`/events/${e.id}`}
              className="flex flex-1 items-center justify-center bg-ink px-8 py-5 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-graphite lg:min-w-[240px]"
            >
              Подробнее и&nbsp;записаться →
            </Link>
          </div>
        </article>

        {!isAuthed ? (
          <Link
            href="/auth"
            className="mt-4 inline-flex h-12 w-full items-center justify-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink md:hidden"
          >
            Присоединиться →
          </Link>
        ) : null}
      </Wrap>
    </section>
  );
}
