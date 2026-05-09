import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import {
  getInterestCounts,
  getMyInterest,
} from "@/lib/api-event-interest";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { getDisplayUpcomingList, type ListedEvent } from "@/lib/display-event";
import { getSiteState } from "@/lib/site-state";

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

type EventSignals = {
  /** Total runners who RSVPed across all locations. */
  totalGoing: number;
  /** Whether the current user is RSVPed (authed only). */
  iAmGoing: boolean;
};

export default async function EventsPage() {
  const [state, events] = await Promise.all([
    getSiteState(),
    getDisplayUpcomingList(8),
  ]);

  const signals = await loadSignals(events, state.isAuthed);

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-16 lg:py-24">
            <div className="flex flex-col gap-3">
              <span className="type-mono-caps">расписание</span>
              <h1 className="type-hero" style={{ fontSize: 72 }}>
                События на&nbsp;
                <em className="not-italic text-brand-red">неделе</em>.
              </h1>
              <p className="type-lede max-w-[640px]">
                Среда, {CLUB.runTime}. Три района, {DISTANCE_RANGE}. Спецзабеги
                помечены отдельно.
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
                {events.map((e, idx) => (
                  <li
                    key={e.id}
                    className={idx > 0 ? "border-t border-ink" : undefined}
                  >
                    <EventRow
                      event={e}
                      signals={
                        signals[e.id] ?? { totalGoing: 0, iAmGoing: false }
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

async function loadSignals(
  events: ListedEvent[],
  isAuthed: boolean,
): Promise<Record<string, EventSignals>> {
  if (events.length === 0) return {};
  const counts = await Promise.all(events.map((e) => getInterestCounts(e.id)));
  const mine = isAuthed
    ? await Promise.all(events.map((e) => getMyInterest(e.id)))
    : events.map(() => null);
  const out: Record<string, EventSignals> = {};
  events.forEach((e, i) => {
    out[e.id] = {
      totalGoing: counts[i].reduce((s, c) => s + c.count, 0),
      iAmGoing: mine[i] !== null,
    };
  });
  return out;
}

function EventRow({
  event,
  signals,
}: {
  event: ListedEvent;
  signals: EventSignals;
}) {
  const d = formatDate(event.startsAt);

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}`}
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
        <div className="flex flex-wrap items-center gap-2">
          {event.type === "special" ? (
            <Badge variant="primary">Спец</Badge>
          ) : event.type === "partner" ? (
            <Badge variant="soft">Партнёр</Badge>
          ) : (
            <Badge variant="default">Среда</Badge>
          )}
          {signals.iAmGoing ? (
            <span className="inline-flex items-center gap-1.5 border border-brand-red bg-brand-red px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
              <span className="block h-1.5 w-1.5 bg-paper" />
              ты&nbsp;идёшь
            </span>
          ) : null}
          <h3 className="type-h3">{event.title}</h3>
        </div>
        {event.locationName ? (
          <p className="text-[13px] text-graphite">{event.locationName}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {event.isPointsEligible && event.basePointsAward > 0 ? (
            <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-brand-red">
              +{event.basePointsAward}&nbsp;Б
            </span>
          ) : null}
          {signals.totalGoing > 0 ? (
            <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
              <span className="text-brand-red">●</span>{" "}
              {signals.totalGoing}&nbsp;идут
            </span>
          ) : null}
        </div>
      </div>

      <span className="font-sans text-[14px] font-medium text-ink md:justify-self-end">
        Подробнее →
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-4 border border-ink bg-paper-2 p-8 md:p-12">
      <span className="type-mono-caps">расписание формируется</span>
      <h2 className="type-h2">
        Ближайших событий{" "}
        <em className="not-italic text-brand-red">пока нет</em>.
      </h2>
      <p className="max-w-[520px] text-[15px] leading-[1.55] text-graphite">
        Расписание на&nbsp;следующую неделю появится в&nbsp;понедельник.
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
