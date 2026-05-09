import Link from "next/link";
import { notFound } from "next/navigation";
import { EventRsvp } from "@/components/events/event-rsvp";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import {
  getInterestCounts,
  getMyInterest,
} from "@/lib/api-event-interest";
import { getPublicEvent, type ApiEvent } from "@/lib/api-events";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { UPCOMING_EVENTS } from "@/lib/home-mock";
import { getSiteState } from "@/lib/site-state";

/** Map a mock EventCard (used as API fallback) into ApiEvent shape so the page renders the same way. */
function mockToApiEvent(id: string): ApiEvent | null {
  const m = UPCOMING_EVENTS.find((e) => e.id === id);
  if (!m) return null;
  const start = new Date(m.startsAt);
  const endsAt = new Date(start.getTime() + 90 * 60_000);
  return {
    id: m.id,
    title: m.title ?? `${CLUB.name} — ${m.location.district}`,
    slug: m.id,
    description: null,
    type: m.type,
    status: "published",
    startsAt: m.startsAt,
    endsAt: endsAt.toISOString(),
    locationName: m.location.venue ?? m.location.district,
    locationAddress: null,
    locationLat: null,
    locationLng: null,
    capacity: null,
    registrationOpenAt: null,
    registrationCloseAt: null,
    isPointsEligible: true,
    basePointsAward: m.type === "regular" ? 30 : 50,
    syncRule: null,
  };
}

const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const RU_WEEKDAYS_LONG = [
  "Воскресенье", "Понедельник", "Вторник", "Среда",
  "Четверг", "Пятница", "Суббота",
];

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return `${RU_WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${RU_MONTHS[d.getMonth()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const event = (await getPublicEvent(params.id)) ?? mockToApiEvent(params.id);
  return { title: event ? `${event.title} · CITYRNNG` : "Событие · CITYRNNG" };
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [state, apiEvent, myInterest, counts] = await Promise.all([
    getSiteState(),
    getPublicEvent(params.id),
    getMyInterest(params.id),
    getInterestCounts(params.id),
  ]);
  // Fall back to mock UPCOMING_EVENTS so non-UUID ids (e.g. "spec-25") still resolve.
  const event = apiEvent ?? mockToApiEvent(params.id);
  if (!event) notFound();
  const startDate = formatFullDate(event.startsAt);
  const startTime = formatTime(event.startsAt);
  const locations = event.syncRule?.locations ?? [];
  const countsByLocation = Object.fromEntries(
    counts.map((c) => [c.locationId, c.count]),
  );

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-16 lg:py-24">
            <div className="flex flex-col gap-4">
              <Link
                href="/events"
                className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
              >
                ← Все события
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                {event.type === "special" ? (
                  <Badge variant="primary">Спец</Badge>
                ) : event.type === "partner" ? (
                  <Badge variant="soft">Партнёр</Badge>
                ) : (
                  <Badge variant="default">Среда</Badge>
                )}
                <span className="type-mono-caps">
                  {startDate.toUpperCase()} · {startTime}
                </span>
              </div>
              <h1 className="type-hero" style={{ fontSize: 72 }}>
                {event.title}
              </h1>
              {event.locationName ? (
                <p className="type-lede">
                  {event.locationName}
                  {event.locationAddress ? ` · ${event.locationAddress}` : ""}
                </p>
              ) : null}
            </div>
          </Wrap>
        </section>

        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <div className="grid grid-cols-1 gap-0 border border-ink lg:grid-cols-[260px_1fr]">
              <dl className="grid grid-cols-2 gap-px bg-ink/10 lg:grid-cols-1 lg:border-r lg:border-ink">
                <Fact k="Когда" v={startDate} />
                <Fact k="Время" v={startTime} />
                <Fact k="Дистанции" v={DISTANCE_RANGE} />
                {event.isPointsEligible && event.basePointsAward > 0 ? (
                  <Fact
                    k="Баллы"
                    v={`+${event.basePointsAward} Б`}
                    accent
                  />
                ) : null}
              </dl>
              <div className="flex flex-col gap-6 bg-paper p-6 md:p-8">
                {event.description ? (
                  <p className="whitespace-pre-line text-[15px] leading-[1.55] text-graphite">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-[15px] leading-[1.55] text-graphite">
                    Старт в&nbsp;{startTime}. Темп любой, {DISTANCE_RANGE}
                    &nbsp;на&nbsp;выбор. Записываться не&nbsp;нужно — просто
                    приходи, Strava зафиксирует.
                  </p>
                )}

                {state.isAuthed && locations.length > 0 ? (
                  <EventRsvp
                    eventKey={params.id}
                    locations={locations.map((l) => ({
                      id: l.id,
                      name: l.name,
                      city: l.city,
                    }))}
                    myLocationId={myInterest?.locationId ?? null}
                    countsByLocation={countsByLocation}
                  />
                ) : null}

                {!state.isAuthed && locations.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <span className="type-mono-caps">точки старта</span>
                    <ul className="flex flex-col">
                      {locations.map((loc) => (
                        <li
                          key={loc.id}
                          className="flex items-center justify-between border-b border-ink/15 py-2 text-[14px]"
                        >
                          <span className="text-ink">{loc.name}</span>
                          <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
                            {loc.city}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-3 pt-4">
                  {state.isAuthed ? (
                    <Link
                      href="/app/profile"
                      className="inline-flex h-12 items-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
                    >
                      Подключить Strava →
                    </Link>
                  ) : (
                    <Link
                      href="/auth"
                      className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
                    >
                      Войти в клуб →
                    </Link>
                  )}
                  <Link
                    href={`/districts#${locations[0]?.id ?? ""}`}
                    className="inline-flex h-12 items-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
                  >
                    Карта маршрутов
                  </Link>
                </div>
              </div>
            </div>
          </Wrap>
        </section>

        <section className="border-b border-ink bg-paper-2/60">
          <Wrap className="flex flex-col gap-3 py-10 text-[13px] text-graphite lg:flex-row lg:items-center lg:justify-between">
            <p>
              Записываться не&nbsp;нужно — {CLUB.name} по&nbsp;средам всегда
              в&nbsp;{CLUB.runTime}.
            </p>
            <Link
              href="/how-it-works"
              className="font-sans font-medium text-ink hover:text-brand-red"
            >
              Как это работает →
            </Link>
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Fact({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 bg-paper p-5 md:p-6">
      <span className="type-mono-caps">{k}</span>
      <span
        className={
          "font-display text-[24px] font-bold leading-none tracking-[-0.02em] " +
          (accent ? "text-brand-red" : "text-ink")
        }
      >
        {v}
      </span>
    </div>
  );
}
