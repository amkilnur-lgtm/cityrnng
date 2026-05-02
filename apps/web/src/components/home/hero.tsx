import Image from "next/image";
import { HeroAuthForm } from "@/components/home/hero-auth-form";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";
import { LOCATIONS } from "@/lib/home-mock";

export function Hero({ event }: { event: DisplayEvent }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <HeroMain />
          <HeroSide event={event} />
        </div>
      </Wrap>
    </section>
  );
}

function HeroMain() {
  return (
    <div className="flex flex-col">
      <h1 className="type-hero">
        Беги по&nbsp;городу.{" "}
        <em className="not-italic text-brand-red">Не&nbsp;один.</em>
      </h1>

      <p className="type-lede mt-6 max-w-[540px]">
        {CLUB.name} — открытое беговое сообщество. Каждую среду
        в&nbsp;{CLUB.runTime} стартуем с&nbsp;трёх точек: Центр, Проспект,
        Черниковка. После пробежки —{" "}
        <span className="bg-brand-tint px-1.5 py-0.5 font-semibold text-brand-red-ink">
          кофе и&nbsp;разговоры
        </span>
        .
      </p>

      <HeroAuthForm />
    </div>
  );
}

function HeroSide({ event }: { event: DisplayEvent }) {
  return (
    <aside className="flex flex-col lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-square border border-ink bg-paper-2">
        <div className="absolute left-5 top-5 z-10 flex flex-col gap-0.5">
          <span className="type-mono-caps">Три маршрута</span>
          <span className="font-sans text-[13px] font-medium text-ink">
            {Object.values(LOCATIONS)
              .map((l) => l.district)
              .join(" · ")}
          </span>
        </div>
        <Image
          src="/brand/runners.png"
          alt="Бегуны Ситираннинг"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          style={{ objectFit: "contain", padding: "10%" }}
          priority
        />
      </div>

      <div className="border border-t-0 border-ink">
        <div className="flex items-center justify-between border-b border-ink px-5 py-4">
          <span className="font-sans text-[14px] font-semibold text-ink">
            Ближайший забег
          </span>
          <span className="type-mono-caps">
            {CLUB.distances.join("/").toUpperCase()}&nbsp;КМ
          </span>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-2 font-mono text-[14px] font-medium tracking-[0.04em]">
            <span className="text-brand-red">
              {CLUB.runDayShort}&nbsp;{event.time}
            </span>
            <span className="text-muted">·</span>
            <span className="text-ink">{event.venue ?? "место уточняется"}</span>
          </div>
          <p className="text-[13px] text-graphite">
            Выбираешь {DISTANCE_RANGE} на&nbsp;старте — темп любой.
          </p>
          <div className="flex items-center justify-between">
            {event.typicalTurnout ? (
              <span className="text-[13px] text-graphite">
                Обычно собирается{" "}
                <b className="font-semibold text-ink">
                  {event.typicalTurnout}
                </b>{" "}
                человек
              </span>
            ) : (
              <span className="text-[13px] text-graphite">
                Записываться не&nbsp;нужно — просто приходи
              </span>
            )}
            <a
              href={`/events/${event.id}`}
              className="text-[13px] font-medium text-ink hover:text-brand-red"
            >
              Подробнее →
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
