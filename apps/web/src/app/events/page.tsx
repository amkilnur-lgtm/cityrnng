import Link from "next/link";
import { EventRow, loadSignals } from "@/components/events/event-row";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import { getDisplayUpcomingList } from "@/lib/display-event";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "События · CITYRNNG" };

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
              <h1 className="type-hero">
                События на&nbsp;
                <em className="not-italic text-brand-red">неделе</em>.
              </h1>
              <p className="type-lede max-w-[640px]">
                Среда, {CLUB.runTime}. Три района, темп любой. Спецзабеги
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
