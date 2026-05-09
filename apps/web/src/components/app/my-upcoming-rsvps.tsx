import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import { CancelRsvpButton } from "@/components/app/cancel-rsvp-button";
import type { ApiEventType } from "@/lib/api-events";

const RU_MONTHS_SHORT = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];
const RU_WEEKDAYS_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

export type MyUpcomingRsvp = {
  eventKey: string;
  title: string;
  type: ApiEventType;
  startsAt: string;
  locationName: string;
  totalGoing: number;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: RU_MONTHS_SHORT[d.getMonth()],
    weekday: RU_WEEKDAYS_SHORT[d.getDay()],
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export function MyUpcomingRsvps({ items }: { items: MyUpcomingRsvp[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-b border-ink">
      <Wrap className="py-12 lg:py-16">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="block h-2 w-2 bg-brand-red" />
          <span className="type-mono-caps text-brand-red">ты идёшь на</span>
        </div>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((it) => (
            <li
              key={it.eventKey}
              className="flex flex-col gap-4 border border-ink bg-paper p-5 md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="type-mono-caps">
                    {fmtDate(it.startsAt).weekday}&nbsp;·&nbsp;
                    {fmtDate(it.startsAt).day}&nbsp;
                    {fmtDate(it.startsAt).month}
                  </span>
                  <span className="font-display text-[36px] font-bold leading-none tracking-[-0.02em] text-ink">
                    {fmtDate(it.startsAt).time}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {it.type === "special" ? (
                    <Badge variant="primary">Спец</Badge>
                  ) : it.type === "partner" ? (
                    <Badge variant="soft">Партнёр</Badge>
                  ) : (
                    <Badge variant="default">Среда</Badge>
                  )}
                  {it.totalGoing > 0 ? (
                    <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
                      <span className="text-brand-red">●</span>{" "}
                      {it.totalGoing}&nbsp;идут
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-sans text-[16px] font-semibold leading-tight text-ink">
                  {it.title}
                </span>
                <span className="text-[13px] text-graphite">
                  точка{" "}
                  <b className="font-semibold text-ink">{it.locationName}</b>
                </span>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <Link
                  href={`/events/${encodeURIComponent(it.eventKey)}`}
                  className="font-sans text-[13px] font-semibold text-ink underline-offset-4 hover:text-brand-red hover:underline"
                >
                  Подробности →
                </Link>
                <span className="text-muted">·</span>
                <CancelRsvpButton eventKey={it.eventKey} />
              </div>
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}
