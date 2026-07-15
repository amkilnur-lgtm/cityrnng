import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import { CLUB } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";
import type { Timeline, TimelineCell } from "@/lib/api-me-timeline";
import { WEEK_CELLS, type AuthedUser, type WeekCell as WeekCellMockT } from "@/lib/home-mock";

/**
 * Build a Timeline-compatible payload out of the legacy WEEK_CELLS mock so
 * dev/guest users see something sensible when there's no real session.
 * Pure presentation — never returned by the API.
 */
function mockTimeline(): Timeline {
  const cells: TimelineCell[] = WEEK_CELLS.map((w) => ({
    date: w.date,
    weekdayShort: w.weekday,
    eventId: `mock-${w.date}`,
    eventType: "regular",
    title: CLUB.name,
    dateLabel: `${w.weekday} · ${w.date}`,
    time: w.time ?? CLUB.runTime,
    kind:
      w.kind === "done"
        ? "done"
        : w.kind === "tomorrow"
          ? "tomorrow"
          : "skipped",
    points: w.kind === "done" ? 60 : undefined,
  }));
  const done = cells.filter((c) => c.kind === "done").length;
  return {
    monthLabel: "апрель",
    cells,
    totals: {
      done,
      total: cells.length,
      progressPct: cells.length === 0 ? 0 : Math.round((done / cells.length) * 100),
    },
  };
}

/**
 * Personal-cabinet weekly grid. When `timeline` is passed (real session),
 * cells come from the API. Otherwise we fall back to the static mock so
 * the dev-mock authed mode keeps rendering something.
 */
export function PersonalDashboard({
  user,
  nextEvent,
  timeline,
}: {
  user: AuthedUser;
  nextEvent?: DisplayEvent;
  timeline?: Timeline | null;
}) {
  const data = timeline ?? mockTimeline();
  const { cells, totals, monthLabel } = data;
  const totalPoints = cells.reduce((s, c) => s + (c.points ?? 0), 0);
  // Last done cell (chronologically last) — drives the "last run" lede line.
  const lastDone = [...cells].reverse().find((c) => c.kind === "done");

  return (
    <section className="border-b border-ink bg-paper-2/60">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col gap-3">
          <span className="type-mono-caps">
            {CLUB.city} · {monthLabel}
          </span>
          <h2 className="type-h2">
            Привет, <em className="not-italic text-brand-red">{user.name}</em>.
          </h2>
          <p className="type-lede max-w-[560px]">
            {lastDone ? (
              <>
                Последняя пробежка засчитана
                {lastDone.points ? (
                  <>
                    ,{" "}
                    <b className="font-semibold text-ink">
                      +{lastDone.points}&nbsp;Б
                    </b>
                  </>
                ) : null}
                .
              </>
            ) : (
              <>В&nbsp;этом месяце пока ни&nbsp;одной — среда близко.</>
            )}
          </p>
        </div>

        <div className="border border-ink bg-paper">
          <div className="flex items-center justify-between border-b border-ink px-5 py-4 md:px-6">
            <span className="type-mono-caps">{monthLabel} · твои пробежки</span>
            <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-ink">
              <b className="text-brand-red">{totals.done}</b>
              <span className="text-muted">
                {" "}
                из {totals.total} пробежек
                {/* «0%» в начале месяца читается как двойка в дневнике —
                    процент показываем только когда есть что показать. */}
                {totals.done > 0 ? ` · ${totals.progressPct}%` : ""}
              </span>
            </span>
          </div>

          <div className="h-1 w-full bg-paper-2">
            <div
              className="h-full bg-brand-red"
              style={{ width: `${totals.progressPct}%` }}
            />
          </div>

          {cells.length === 0 ? (
            <p className="px-5 py-6 text-[14px] text-graphite md:px-6">
              На этот месяц пока нет событий — ждём расписание.
            </p>
          ) : (
            // -mt-px/-ml-px + overflow-hidden clip each cell's outermost
            // top/left border so the grid's own edges stay flush with the
            // card, leaving only the inter-cell dividers visible.
            <div className="overflow-hidden">
              <div className="-ml-px -mt-px grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {cells.map((cell) => (
                  <TimelineCellView
                    key={cell.date}
                    cell={cell}
                    nextEvent={nextEvent}
                  />
                ))}
                {/* Calendar-style fillers: pad the ragged last row with empty
                    muted slots so every row keeps full gridlines — without
                    them the cells bordering the tail lose their bottom/right
                    dividers and the corner reads as a broken void. Visibility
                    is per-breakpoint: lg (4 cols) needs (4 - N%4)%4 fillers,
                    md (2 cols) needs one only when N is odd, 1-col never. */}
                {Array.from(
                  { length: (4 - (cells.length % 4)) % 4 },
                  (_, i) => (
                    <div
                      key={`filler-${i}`}
                      aria-hidden
                      className={
                        "min-h-[7.25rem] border-l border-t border-ink bg-paper-2/40 " +
                        (cells.length % 2 === 1 && i === 0
                          ? "hidden md:block"
                          : "hidden lg:block")
                      }
                    />
                  ),
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 divide-ink border-t border-ink md:divide-x">
            {[
              { k: "Пробежек", v: `${totals.done}`, s: `за ${monthLabel}` },
              { k: "Баллов", v: `${totalPoints}`, s: `за ${monthLabel}` },
            ].map((kpi, i) => (
              <div
                key={kpi.k}
                className={
                  "flex flex-col gap-1 px-5 py-4 md:px-6 md:py-5" +
                  (i % 2 !== 0 ? " border-l border-ink md:border-l-0" : "")
                }
              >
                <span className="type-mono-caps">{kpi.k}</span>
                <span className="font-display text-[24px] font-bold leading-none tracking-[-0.02em] text-ink">
                  {kpi.v}
                </span>
                <span className="text-[12px] text-muted">{kpi.s}</span>
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}

function TimelineCellView({
  cell,
  nextEvent,
}: {
  cell: TimelineCell;
  nextEvent?: DisplayEvent;
}) {
  // All four card kinds share a 3-row layout + min-height so the grid stays
  // visually even regardless of state. Each cell carries its own top+left
  // ink border; the grid wrapper clips the outermost of those (first row's
  // top, first column's left) so only inter-cell dividers show — this draws
  // correct separators for ANY cell count, including a ragged last row,
  // where `divide-*` leaves gaps.
  const SHELL =
    "flex h-full min-h-[7.25rem] flex-col gap-2 border-l border-t border-ink px-5 py-5 md:px-6";

  const isSpecial = cell.eventType === "special";
  const SpecialBadge = isSpecial ? (
    <Badge variant="primary" className="ml-1">
      спец
    </Badge>
  ) : null;

  // Three close states share the same prominent red card:
  //   today    — событие сегодня (часы до старта)
  //   tomorrow — завтра
  //   soon     — за 2-3 дня (окно RSVP открыто)
  // Различаются только бейджем (СЕГОДНЯ / ЗАВТРА / ОЖИДАЕТСЯ). Inline-кнопка
  // «Я иду» / «✓ Я иду» — на всех трёх для regular (special уже выделен
  // бейджем «спец», а у спецов одна точка старта, выбор не нужен).
  if (cell.kind === "today" || cell.kind === "tomorrow" || cell.kind === "soon") {
    const time = nextEvent?.time ?? cell.time;
    const badge =
      cell.kind === "today"
        ? "СЕГОДНЯ"
        : cell.kind === "tomorrow"
          ? "ЗАВТРА"
          : "ОЖИДАЕТСЯ";
    const showRsvp = !isSpecial;
    const isGoing = cell.isGoing === true;
    return (
      <Link
        href={`/events/${encodeURIComponent(cell.eventId)}`}
        className={`${SHELL} bg-brand-red text-paper transition-colors hover:bg-brand-red-ink`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
            {cell.dateLabel}
          </span>
          <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
            {badge}
          </span>
        </div>
        <span className="font-display text-[18px] font-bold leading-tight">
          {cell.title}
        </span>
        <span className="font-mono text-[20px] font-medium leading-none tracking-[0.04em] opacity-95">
          {time}
        </span>
        {showRsvp ? (
          isGoing ? (
            <span className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 border border-paper bg-ink px-4 font-sans text-[14px] font-bold tracking-tight text-paper">
              <span aria-hidden className="font-mono text-[16px]">✓</span>
              Я иду
            </span>
          ) : (
            <span className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 border border-paper bg-paper px-4 font-sans text-[14px] font-bold tracking-tight text-brand-red transition-colors hover:bg-paper-2">
              Я иду →
            </span>
          )
        ) : null}
      </Link>
    );
  }

  if (cell.kind === "done") {
    return (
      <Link href={`/events/${encodeURIComponent(cell.eventId)}`} className={`${SHELL} bg-paper text-ink transition-colors hover:bg-paper-2`}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            {cell.dateLabel}
          </span>
          {SpecialBadge}
          <span
            aria-label="выполнено"
            className="ml-auto inline-flex h-5 w-5 items-center justify-center bg-ink font-mono text-[12px] font-bold leading-none text-paper"
          >
            ✓
          </span>
        </div>
        <span className="font-display text-[24px] font-bold leading-none text-ink">
          {cell.title}
        </span>
        <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-brand-red">
          {cell.points ? `+ ${cell.points} Б` : "выполнено"}
        </span>
      </Link>
    );
  }

  if (cell.kind === "upcoming") {
    return (
      <Link
        href={`/events/${encodeURIComponent(cell.eventId)}`}
        className={`${SHELL} bg-paper text-muted transition-colors hover:bg-paper-2`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            {cell.dateLabel}
          </span>
          {SpecialBadge}
        </div>
        <span className="font-display text-[24px] font-bold leading-none text-muted-2">
          {isSpecial ? cell.title : "ожидается"}
        </span>
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
          {isSpecial ? "ожидается" : `старт ${cell.time}`}
        </span>
      </Link>
    );
  }

  // kind === "skipped"
  return (
    <Link
      href={`/events/${encodeURIComponent(cell.eventId)}`}
      className={`${SHELL} bg-paper-2 transition-colors hover:bg-paper`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {cell.dateLabel}
        </span>
        {SpecialBadge}
      </div>
      <span className="font-display text-[24px] font-bold leading-none text-muted-2 line-through decoration-muted-2">
        пропуск
      </span>
      <span className="text-[12px] text-muted">без&nbsp;баллов</span>
    </Link>
  );
}
// Re-export mock-cell type to keep callers (if any) compiling — we still use
// the static mock fallback through mockTimeline() above.
export type { WeekCellMockT };
