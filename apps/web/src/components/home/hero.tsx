import Image from "next/image";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";

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
        Бегаешь по&nbsp;городу{" "}
        <span className="font-semibold text-muted-2">—</span> меняешь
        у&nbsp;соседа на&nbsp;<em className="not-italic text-brand-red">кофе</em>.
      </h1>

      <p className="type-lede mt-6 max-w-[520px]">
        Соседи, кофейни, маршрут по&nbsp;средам вечером. Без&nbsp;гонки,
        без&nbsp;секундомера.{" "}
        <b className="font-semibold text-ink">+50&nbsp;баллов</b>{" "}
        за&nbsp;регистрацию — хватит на&nbsp;первый{" "}
        <span className="bg-brand-tint px-1.5 py-0.5 font-semibold text-brand-red-ink">
          капучино у&nbsp;Маши
        </span>
        .
      </p>

      <form className="mt-10 flex flex-col gap-3" noValidate>
        <label htmlFor="hero-email" className="type-label">
          Войти или&nbsp;зарегистрироваться
        </label>
        <div className="flex h-14 flex-col border border-ink sm:flex-row">
          <input
            id="hero-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="min-w-0 flex-1 bg-paper px-4 font-sans text-[15px] text-ink outline-none placeholder:text-muted-2 focus:bg-brand-tint/40"
          />
          <button
            type="submit"
            className="h-14 border-t border-ink bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink sm:border-l sm:border-t-0"
          >
            Получить ссылку →
          </button>
        </div>
        <p className="text-[13px] text-muted">
          Пришлём ссылку на&nbsp;email — без пароля. 20&nbsp;секунд —
          и&nbsp;ты&nbsp;в&nbsp;клубе.
        </p>
      </form>
    </div>
  );
}

function HeroSide({ event }: { event: DisplayEvent }) {
  return (
    <aside className="flex flex-col lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-square border border-ink bg-paper-2">
        <div className="absolute left-5 top-5 z-10 flex flex-col gap-0.5">
          <span className="type-mono-caps">Маршрут</span>
          <span className="font-sans text-[13px] font-medium text-ink">
            {event.district} · {DISTANCE_RANGE}
          </span>
        </div>
        <Image
          src="/brand/runner-red.png"
          alt="Бегун Ситираннинг"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          style={{ objectFit: "contain", padding: "11%" }}
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
            <span className="text-muted-2">·</span>
            <span className="text-ink">{event.venue ?? "место уточняется"}</span>
          </div>
          <p className="text-[13px] text-graphite">
            Выбираешь {DISTANCE_RANGE} на&nbsp;старте — темп любой.
          </p>
          <div className="flex items-center justify-between">
            {event.typicalTurnout ? (
              <span className="text-[13px] text-graphite">
                Обычно приходит{" "}
                <b className="font-semibold text-ink">
                  {event.typicalTurnout}
                </b>{" "}
                соседей
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
