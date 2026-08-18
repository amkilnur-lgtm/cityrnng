import Link from "next/link";
import { EventRow, loadSignals } from "@/components/events/event-row";
import { Wrap } from "@/components/site/wrap";
import { getDisplayUpcomingList } from "@/lib/display-event";

const VISIBLE_LIMIT = 2;

/**
 * Compact upcoming-events list shared by `/` (guest) and `/app` (authed).
 * Shows up to `VISIBLE_LIMIT` rows using the same EventRow visual as the
 * full `/events` listing, plus a "Все события →" CTA.
 */
export async function UpcomingEvents({ isAuthed }: { isAuthed: boolean }) {
  const events = await getDisplayUpcomingList(2);
  const visible = events.slice(0, VISIBLE_LIMIT);
  const signals = await loadSignals(visible, isAuthed);

  return (
    <section>
      <Wrap className="py-10 lg:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">ближайшие события</span>
            <h2 className="type-h2">
              Что&nbsp;<em className="not-italic text-brand-red">дальше</em>.
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex h-10 items-center rounded-full bg-paper-2 px-4 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-paper-3"
          >
            Все события →
          </Link>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-3xl bg-paper-2 p-8 text-[15px] leading-[1.55] text-graphite md:p-10">
            Расписание формируется. Загляни в&nbsp;понедельник.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line/10 overflow-hidden rounded-3xl bg-paper ring-1 ring-line/10">
            {visible.map((e) => (
              <li key={e.id}>
                <EventRow
                  event={e}
                  signals={signals[e.id] ?? { totalGoing: 0, iAmGoing: false }}
                />
              </li>
            ))}
          </ul>
        )}
      </Wrap>
    </section>
  );
}
