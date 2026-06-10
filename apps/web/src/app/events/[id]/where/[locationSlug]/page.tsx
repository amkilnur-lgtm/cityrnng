import Link from "next/link";
import { notFound } from "next/navigation";
import { LocationRsvpButton } from "@/components/events/location-rsvp-button";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import {
  getEventLocationDetail,
  getMyEventStatus,
} from "@/lib/api-event-interest";
import { getPublicEvent } from "@/lib/api-events";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Точка старта · CITYRNNG" };

const RU_MONTHS_GEN_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const RU_WEEKDAYS_NOM = [
  "Воскресенье", "Понедельник", "Вторник", "Среда",
  "Четверг", "Пятница", "Суббота",
];

function fmtDate(iso: string): { weekdayDate: string; time: string } {
  const d = new Date(iso);
  return {
    weekdayDate: `${RU_WEEKDAYS_NOM[d.getDay()]} · ${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS_GEN_SHORT[d.getMonth()]}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

function pluralPeople(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "человек";
  if (mod10 === 1) return "человек";
  if (mod10 >= 2 && mod10 <= 4) return "человека";
  return "человек";
}

export default async function LocationDetailPage({
  params,
}: {
  params: { id: string; locationSlug: string };
}) {
  const [state, detail, event, myStatus] = await Promise.all([
    getSiteState(),
    getEventLocationDetail(params.id, params.locationSlug),
    getPublicEvent(params.id),
    getMyEventStatus(params.id),
  ]);
  if (!detail || !event) notFound();

  const dt = fmtDate(event.startsAt);
  const myInterest = myStatus?.interest;
  const iAmGoingHere =
    myInterest?.status === "going" &&
    myInterest.locationId === detail.location.id;
  const iAmGoingElsewhere =
    myInterest?.status === "going" &&
    myInterest.locationId !== detail.location.id;

  // Ставим текущего юзера в начало списка, чтобы он видел себя сверху.
  const meIndex = state.isAuthed
    ? detail.going.findIndex(
        (g) => myInterest && g.userId === myInterest.userId,
      )
    : -1;
  const me = meIndex >= 0 ? detail.going[meIndex] : null;
  const others = detail.going.filter((_, i) => i !== meIndex);
  const totalGoing = detail.going.length;

  const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(
    [detail.location.venue, detail.location.address, detail.location.city]
      .filter(Boolean)
      .join(", "),
  )}`;

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-10 lg:py-14">
            <Link
              href={`/events/${encodeURIComponent(decodeURIComponent(params.id))}`}
              className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
            >
              ← к событию
            </Link>
            <span className="type-mono-caps mt-4 block">точка старта</span>
            <h1 className="type-hero mt-3" style={{ fontSize: 48 }}>
              {detail.location.name}
            </h1>
            <p className="mt-4 max-w-prose text-[16px] text-graphite">
              {detail.location.venue ? (
                <>
                  <span className="text-ink">{detail.location.venue}</span>
                  {detail.location.address ? (
                    <>
                      <span className="mx-2 text-muted">·</span>
                      {detail.location.address}
                    </>
                  ) : null}
                </>
              ) : (
                detail.location.address ?? detail.location.city
              )}
            </p>
          </Wrap>
        </section>

        {/* Карта — пока внешний переход в Я.Карты; iframe-embed добавим
            отдельным PR'ом когда подключим API-ключ. Без Wrap'а чтобы
            hover-фон растягивался во всю ширину секции, а не упирался
            в горизонтальные паддинги Wrap'а. */}
        <section className="border-b border-ink">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-[200px] w-full place-items-center bg-paper-2 transition-colors hover:bg-paper md:h-[260px]"
          >
            <div className="flex flex-col items-center gap-2 text-muted">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                карта
              </span>
              <span className="text-[13px] text-ink">
                {detail.location.address ?? detail.location.city}
              </span>
              <span className="font-mono text-[11px] text-brand-red">
                открыть в Яндекс.Картах →
              </span>
            </div>
          </a>
        </section>

        <section className="border-b border-ink">
          <Wrap className="py-10">
            <span className="type-mono-caps">когда</span>
            <h2 className="type-h2 mt-3">
              {dt.weekdayDate} ·{" "}
              <em className="not-italic text-brand-red">{dt.time}</em>
            </h2>
            <p className="mt-2 text-[15px] text-graphite">{event.title}</p>

            <div className="mt-6 flex flex-col items-start gap-3">
              {iAmGoingHere ? (
                <>
                  <span className="inline-flex h-12 items-center gap-2 border-2 border-brand-red bg-brand-red px-5 font-sans text-[15px] font-bold text-paper">
                    <span aria-hidden className="font-mono text-[16px]">✓</span>
                    Ты идёшь сюда
                  </span>
                  <Link
                    href={`/events/${encodeURIComponent(decodeURIComponent(params.id))}`}
                    className="font-sans text-[13px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline"
                  >
                    перейти на другую точку →
                  </Link>
                </>
              ) : iAmGoingElsewhere ? (
                <>
                  <p className="text-[14px] text-graphite">
                    Сейчас ты идёшь на другую точку. Переместиться?
                  </p>
                  <LocationRsvpButton
                    eventKey={params.id}
                    locationId={detail.location.id}
                    label="Переместить сюда →"
                  />
                  <Link
                    href={`/events/${encodeURIComponent(decodeURIComponent(params.id))}`}
                    className="font-sans text-[13px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline"
                  >
                    ← к событию
                  </Link>
                </>
              ) : state.isAuthed ? (
                <LocationRsvpButton
                  eventKey={params.id}
                  locationId={detail.location.id}
                  label="Я иду сюда →"
                />
              ) : (
                <Link
                  href="/auth"
                  className="inline-flex h-12 items-center gap-2 border-2 border-brand-red bg-brand-red px-5 font-sans text-[15px] font-bold text-paper hover:bg-brand-red-ink"
                >
                  Войти, чтобы записаться →
                </Link>
              )}
            </div>
          </Wrap>
        </section>

        <section className="border-b border-ink">
          <Wrap className="py-10">
            <span className="type-mono-caps">кто идёт</span>
            <h2 className="type-h2 mt-3">
              {totalGoing > 0 ? (
                <>
                  {totalGoing}{" "}
                  <em className="not-italic text-brand-red">
                    {pluralPeople(totalGoing)}
                  </em>{" "}
                  на эту точку.
                </>
              ) : (
                <>Пока никто не записался.</>
              )}
            </h2>

            {totalGoing === 0 ? (
              <p className="mt-4 max-w-prose text-[15px] text-graphite">
                Будь первым — нажми «Я иду сюда».
              </p>
            ) : (
              <ul className="mt-6 flex flex-col border border-ink">
                {me ? (
                  <li className="flex items-center justify-between gap-3 border-b border-ink/15 bg-paper-2/40 px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center bg-ink font-display text-[14px] font-bold text-paper">
                        {me.displayName.slice(0, 1)}
                      </span>
                      <span className="font-sans text-[15px] font-semibold text-ink">
                        {me.displayName}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-red">
                      это ты
                    </span>
                  </li>
                ) : null}
                {others.map((u, idx) => (
                  <li
                    key={u.userId}
                    className={
                      "flex items-center gap-3 px-4 py-3 " +
                      (idx > 0 || me ? "border-t border-ink/15" : "")
                    }
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-ink bg-paper font-display text-[14px] font-bold text-ink">
                      {u.displayName.slice(0, 1)}
                    </span>
                    <span className="font-sans text-[15px] text-ink">
                      {u.displayName}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-[12px] text-muted">
              имена видят только зарегистрированные участники клуба.
            </p>
          </Wrap>
        </section>

        <section>
          <Wrap className="py-8">
            <Link
              href={`/events/${encodeURIComponent(decodeURIComponent(params.id))}`}
              className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
            >
              ← к событию
            </Link>
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
