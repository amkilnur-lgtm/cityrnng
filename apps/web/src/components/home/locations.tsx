import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { LOCATIONS } from "@/lib/home-mock";

export function Locations() {
  const list = Object.values(LOCATIONS);
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">где бегаем</span>
            <h2 className="type-h2">
              <em className="not-italic text-brand-red">{list.length} района</em>{" "}
              {CLUB.cityGenitive}. Среда ротируется.
            </h2>
          </div>
          <Link
            href="/districts"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Карта маршрутов →
          </Link>
        </div>

        <div className="grid grid-cols-1 border border-ink md:grid-cols-3">
          {list.map((loc, idx) => (
            <Link
              key={loc.slug}
              href={`/districts/${loc.slug}`}
              className={
                "flex flex-col gap-3 p-6 transition-colors hover:bg-paper-2 md:p-8" +
                (idx > 0 ? " border-t border-ink md:border-l md:border-t-0" : "")
              }
            >
              <span className="type-mono-caps">район</span>
              <h3 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[32px]">
                {loc.district}
              </h3>
              <dl className="flex flex-col gap-1.5 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Старт</dt>
                  <dd className="text-right text-ink">
                    {loc.venue ?? (
                      <span className="text-muted-2">уточняется</span>
                    )}
                  </dd>
                </div>
                {loc.landmark ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Ориентир</dt>
                    <dd className="text-right text-ink">{loc.landmark}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Время</dt>
                  <dd className="text-right font-mono text-ink tracking-[0.04em]">
                    {CLUB.runDayLong} · {CLUB.runTime}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Дистанции</dt>
                  <dd className="text-right text-ink">{DISTANCE_RANGE}</dd>
                </div>
              </dl>
              <span className="mt-auto text-[13px] font-medium text-ink">
                Посмотреть маршрут →
              </span>
            </Link>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
