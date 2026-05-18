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
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">ближайшие события</span>
            <h2 className="type-h2">
              На&nbsp;
              <em className="not-italic text-brand-red">неделе</em>.
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Все события →
          </Link>
        </div>

        {visible.length === 0 ? (
          <p className="border border-ink bg-paper-2 p-8 text-[15px] leading-[1.55] text-graphite md:p-10">
            Расписание формируется. Загляни в&nbsp;понедельник.
          </p>
        ) : (
          <ul className="flex flex-col border border-ink">
            {visible.map((e, idx) => (
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
  );
}
