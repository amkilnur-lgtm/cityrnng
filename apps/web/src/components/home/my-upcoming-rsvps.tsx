import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import type { MyUpcomingRsvp } from "@/lib/display-event";

const RU_MONTHS_SHORT = [
  "ЯНВ",
  "ФЕВ",
  "МАР",
  "АПР",
  "МАЙ",
  "ИЮН",
  "ИЮЛ",
  "АВГ",
  "СЕН",
  "ОКТ",
  "НОЯ",
  "ДЕК",
];
const RU_WEEKDAYS_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const wd = RU_WEEKDAYS_SHORT[d.getDay()];
  const day = String(d.getDate()).padStart(2, "0");
  const mo = RU_MONTHS_SHORT[d.getMonth()];
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${wd} · ${day} ${mo} · ${time}`;
}

export function MyUpcomingRsvps({ rsvps }: { rsvps: MyUpcomingRsvp[] }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-12 lg:py-16">
        <div className="mb-6 flex flex-col gap-2">
          <span className="type-mono-caps">мои записи</span>
          <h2 className="type-h2">
            {rsvps.length > 0 ? (
              <>
                Ты идёшь{" "}
                <em className="not-italic text-brand-red">
                  {rsvps.length === 1 ? "на одно" : `на ${rsvps.length}`}
                </em>{" "}
                событий{rsvps.length === 1 ? "" : ""}.
              </>
            ) : (
              <>
                Пока{" "}
                <em className="not-italic text-brand-red">никаких</em>{" "}
                записей.
              </>
            )}
          </h2>
        </div>

        {rsvps.length === 0 ? (
          <p className="max-w-prose text-[14px] text-graphite">
            Открой ближайшее событие и&nbsp;нажми «Записаться» — оно
            появится в&nbsp;этом списке.
          </p>
        ) : (
          <ul className="flex flex-col border border-ink">
            {rsvps.map((r, idx) => (
              <li
                key={r.eventKey}
                className={
                  "grid grid-cols-1 gap-3 p-5 md:grid-cols-[200px_1fr_auto] md:items-center md:gap-6 md:p-6 " +
                  (idx > 0 ? "border-t border-ink/15" : "")
                }
              >
                <span className="font-mono text-[12px] tracking-[0.04em] text-graphite">
                  {formatWhen(r.startsAt)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {r.type === "special" ? (
                    <Badge variant="primary">Спец</Badge>
                  ) : r.type === "partner" ? (
                    <Badge variant="soft">Партнёр</Badge>
                  ) : null}
                  <span className="font-sans text-[15px] font-semibold text-ink">
                    {r.title}
                  </span>
                  <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
                    · {r.locationName}
                  </span>
                </div>
                <Link
                  href={`/events/${encodeURIComponent(r.eventKey)}`}
                  className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper md:justify-self-end"
                >
                  Открыть →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Wrap>
    </section>
  );
}
