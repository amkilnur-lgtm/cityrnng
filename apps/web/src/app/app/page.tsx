import Link from "next/link";
import { redirect } from "next/navigation";
import { FinalCta } from "@/components/home/final-cta";
import { Journal } from "@/components/home/journal";
import { NextEvent } from "@/components/home/next-event";
import { PersonalDashboard } from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import {
  MyUpcomingRsvps,
  type MyUpcomingRsvp,
} from "@/components/app/my-upcoming-rsvps";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { getDisplayNextEvent, getNextEventRsvp } from "@/lib/display-event";
import {
  getInterestCounts,
  getMyInterest,
} from "@/lib/api-event-interest";
import { listUpcomingEvents } from "@/lib/api-events";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Личный кабинет · CITYRNNG" };

export default async function AppDashboardPage() {
  const [state, nextEvent, myUpcoming, rsvp] = await Promise.all([
    getSiteState(),
    getDisplayNextEvent(),
    loadMyUpcomingRsvps(),
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
        <MyUpcomingRsvps items={myUpcoming} />
        <NextEvent event={nextEvent} rsvp={rsvp} isAuthed />
        <ShopPreview user={state.user} />
        <Journal />
        <FinalCta isAuthed />
      </main>
      <SiteFooter />
    </>
  );
}

async function loadMyUpcomingRsvps(): Promise<MyUpcomingRsvp[]> {
  const events = await listUpcomingEvents(8);
  if (events.length === 0) return [];
  const [mine, counts] = await Promise.all([
    Promise.all(events.map((e) => getMyInterest(e.id))),
    Promise.all(events.map((e) => getInterestCounts(e.id))),
  ]);
  const out: MyUpcomingRsvp[] = [];
  events.forEach((e, i) => {
    const myInt = mine[i];
    if (!myInt) return;
    const loc = e.locations.find((l) => l.id === myInt.locationId);
    out.push({
      eventKey: e.id,
      title: e.title || (e.type === "regular" ? "Сити Раннинг — пробежка" : "Спецсобытие"),
      type: e.type,
      startsAt: e.startsAt,
      locationName: loc?.name ?? "—",
      totalGoing: counts[i].reduce((s, c) => s + c.count, 0),
    });
  });
  return out;
}
