import Link from "next/link";
import { redirect } from "next/navigation";
import { EventRsvp } from "@/components/events/event-rsvp";
import { FinalCta } from "@/components/home/final-cta";
import { Journal } from "@/components/home/journal";
import { PersonalDashboard } from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import {
  getDisplayNextEvent,
  getNextEventRsvp,
  type NextEventRsvp,
} from "@/lib/display-event";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Личный кабинет · CITYRNNG" };

export default async function AppDashboardPage() {
  const [state, nextEvent, rsvp] = await Promise.all([
    getSiteState(),
    getDisplayNextEvent(),
    getNextEventRsvp(),
  ]);
  // Either real session OR dev-mock authed unlocks /app — both flow through state.isAuthed.
  if (!state.isAuthed) redirect("/auth");

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink bg-brand-tint/30">
          <Wrap className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
            <p className="text-[14px] text-graphite">
              Привет,{" "}
              <b className="font-semibold text-ink">{state.user.name}</b>!
              Баланс, профиль, обмены и&nbsp;Strava — всё в&nbsp;кабинете.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/profile"
                className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
              >
                Профиль
              </Link>
              <Link
                href="/app/points"
                className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
              >
                Баллы
              </Link>
              <Link
                href="/app/rewards"
                className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
              >
                Обмены
              </Link>
            </div>
          </Wrap>
        </section>

        <PersonalDashboard user={state.user} nextEvent={nextEvent} />
        {rsvp ? <NextRsvpSection rsvp={rsvp} /> : null}
        <ShopPreview user={state.user} />
        <Journal />
        <FinalCta isAuthed />
      </main>
      <SiteFooter />
    </>
  );
}

const RU_MONTHS_SHORT = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];
const RU_WEEKDAYS_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

function NextRsvpSection({ rsvp }: { rsvp: NextEventRsvp }) {
  const start = new Date(rsvp.startsAt);
  const dateLabel =
    `${RU_WEEKDAYS_SHORT[start.getDay()]} · ` +
    `${String(start.getDate()).padStart(2, "0")} ` +
    `${RU_MONTHS_SHORT[start.getMonth()]}`;
  const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;

  return (
    <section className="border-b border-ink">
      <Wrap className="flex flex-col gap-6 py-12 lg:py-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="block h-2 w-2 bg-brand-red" />
          <span className="type-mono-caps text-brand-red">
            ближайший старт
          </span>
          {rsvp.type === "special" ? (
            <Badge variant="primary">Спец</Badge>
          ) : rsvp.type === "partner" ? (
            <Badge variant="soft">Партнёр</Badge>
          ) : (
            <Badge variant="default">Среда</Badge>
          )}
          <span className="type-mono-caps">
            {dateLabel} · {timeLabel}
          </span>
        </div>
        <h2 className="font-display text-[32px] font-bold leading-none tracking-[-0.02em] text-ink md:text-[40px]">
          {rsvp.title}
        </h2>
        <EventRsvp
          eventKey={rsvp.eventKey}
          locations={rsvp.locations}
          myLocationId={rsvp.myLocationId}
          countsByLocation={rsvp.countsByLocation}
          isAuthed
          variant="full"
        />
      </Wrap>
    </section>
  );
}
