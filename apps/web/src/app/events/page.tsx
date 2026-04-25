import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { filterUpcoming, listPublicEvents } from "@/lib/api-events";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { sessionToSiteState } from "@/lib/home-mock";
import { getSession } from "@/lib/session";

export const metadata = { title: "События · CITYRNNG" };

const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const RU_WEEKDAYS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: RU_MONTHS[d.getMonth()].toUpperCase(),
    weekday: RU_WEEKDAYS[d.getDay()],
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export default async function EventsPage() {
  const session = await getSession();
  const state = sessionToSiteState(session);
  const events = filterUpcoming(await listPublicEvents());

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-16 lg:py-24">
            <div className="flex flex-col gap-3">
              <span className="type-mono-caps">расписание</span>
              <h1 className="type-hero" style={{ fontSize: 72 }}>
                Среды <em className="not-italic text-brand-red">впереди</em>.
              </h1>
              <p className="type-lede max-w-[640px]">
                Каждую {CLUB.runDayLong} в&nbsp;{CLUB.runTime} — старт
                в&nbsp;одном из&nbsp;районов {CLUB.cityGenitive}. Две дистанции
                на&nbsp;выбор: {DISTANCE_RANGE}.
              </p>
            </div>
          </Wrap>
        </section>

        <section className="border-b border-ink">
          <Wrap className="py-16 lg:py-24">
            {events.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="flex flex-col border border-ink">
                {events.map((e, idx) => {
                  const d = formatDate(e.startsAt);
                  return (
                    <li
                      key={e.id}
                      className={
                        idx > 0 ? "border-t border-ink" : undefined
                      }
                    >
                      <Link
                        href={`/events/${e.id}`}
                        className="grid grid-cols-1 gap-4 p-6 transition-colors hover:bg-paper-2 md:grid-cols-[140px_1fr_auto] md:items-center md:gap-8 md:p-8"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="type-mono-caps">
                            {d.weekday}&nbsp;·&nbsp;{d.month}
                          </span>
                          <span className="font-display text-[56px] font-bold leading-none tracking-[-0.03em] text-ink">
                            {d.day}
                          </span>
                          <span className="mt-1 font-mono text-[13px] font-medium tracking-[0.04em] text-ink">
                            {d.time}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <h3 className="type-h3">{e.title}</h3>
                          {e.locationName ? (
                            <p className="text-[13px] text-graphite">
                              {e.locationName}
                              {e.locationAddress ? ` · ${e.locationAddress}` : ""}
                            </p>
                          ) : null}
                          {e.isPointsEligible && e.basePointsAward > 0 ? (
                            <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-brand-red">
                              +{e.basePointsAward}&nbsp;Б
                            </span>
                          ) : null}
                        </div>

                        <span className="font-sans text-[14px] font-medium text-ink md:justify-self-end">
                          Подробнее →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-4 border border-ink bg-paper-2 p-8 md:p-12">
      <span className="type-mono-caps">расписание формируется</span>
      <h2 className="type-h2">
        Ближайших сред <em className="not-italic text-brand-red">пока нет</em>.
      </h2>
      <p className="max-w-[520px] text-[15px] leading-[1.55] text-graphite">
        Как только событие появится в&nbsp;админке — покажем здесь. Обычно
        ближайший старт анонсируем в&nbsp;понедельник.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
      >
        ← На главную
      </Link>
    </div>
  );
}
