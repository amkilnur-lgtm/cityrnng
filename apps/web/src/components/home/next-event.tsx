import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";

export function NextEvent({
  isAuthed,
  event,
}: {
  isAuthed: boolean;
  event: DisplayEvent;
}) {
  const e = event;

  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">ближайшая пробежка</span>
            <h2 className="type-h2">
              {isAuthed ? (
                <>
                  Скоро — твоя{" "}
                  <em className="not-italic text-brand-red">пробежка</em>.
                </>
              ) : (
                <>
                  Следующая{" "}
                  <em className="not-italic text-brand-red">пробежка</em>.
                </>
              )}
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Все пробежки →
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
              {e.district}
            </h3>
            <p className="text-[15px] leading-[1.55] text-graphite">
              {e.venue ? (
                <>Старт — {e.venue}. </>
              ) : (
                <>Точка старта уточняется. </>
              )}
              {e.landmark ? <>Ориентир — {e.landmark}. </> : null}
              Темп любой, {DISTANCE_RANGE} на&nbsp;выбор.
            </p>
            <div className="flex flex-wrap gap-2">
              {e.distances.map((d) => (
                <span
                  key={d}
                  className="inline-flex h-8 items-center border border-ink bg-paper px-3 font-mono text-[13px] font-medium tracking-[0.04em] text-ink"
                >
                  {d}&nbsp;км
                </span>
              ))}
              <span className="inline-flex h-8 items-center border border-ink/30 px-3 font-mono text-[13px] font-medium tracking-[0.04em] text-muted">
                {CLUB.runTime}
              </span>
            </div>

            <p className="mt-auto pt-2 text-[13px] text-graphite">
              {e.typicalTurnout ? (
                <>
                  Обычно приходит{" "}
                  <b className="font-semibold text-ink">{e.typicalTurnout}</b>{" "}
                  соседей. Записываться не&nbsp;нужно — просто приходи.
                </>
              ) : (
                <>Записываться не&nbsp;нужно — просто приходи.</>
              )}
            </p>
          </div>

          <div className="flex flex-col bg-paper">
            <Link
              href={`/events/${e.id}`}
              className="flex flex-1 items-center justify-center bg-ink px-8 py-5 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-graphite lg:min-w-[240px]"
            >
              Маршрут и&nbsp;точка старта →
            </Link>
            <Link
              href="/districts"
              className="flex items-center justify-center border-t border-ink px-8 py-3 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-paper-2"
            >
              Все районы клуба
            </Link>
          </div>
        </article>
      </Wrap>
    </section>
  );
}
