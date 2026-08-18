import Image from "next/image";
import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import { CLUB } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";
import type { Timeline, TimelineCell } from "@/lib/api-me-timeline";
import { pluralRu } from "@/lib/plural";
import { WEEK_CELLS, type AuthedUser, type WeekCell as WeekCellMockT } from "@/lib/home-mock";

/** Progress toward the next reward the runner is saving for. */
export type RewardProgress = {
  rewardTitle: string;
  partnerName: string;
  cost: number;
  balance: number;
};

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
  progress,
}: {
  user: AuthedUser;
  nextEvent?: DisplayEvent;
  timeline?: Timeline | null;
  progress?: RewardProgress | null;
}) {
  const data = timeline ?? mockTimeline();
  const { cells, totals, monthLabel } = data;
  const totalPoints = cells.reduce((s, c) => s + (c.points ?? 0), 0);

  const showNudge = progress != null && progress.cost > progress.balance;
  const remaining = showNudge ? progress!.cost - progress!.balance : 0;
  const pct = showNudge
    ? Math.min(100, Math.round((progress!.balance / progress!.cost) * 100))
    : 0;

  return (
    <section className="border-b border-ink/10 bg-paper-2/50">
      <Wrap className="py-14 lg:py-20">
        {/* Greeting + brand character */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">
              {CLUB.city} · {monthLabel}
            </span>
            <h2 className="type-h2">
              Привет, <em className="not-italic text-brand-red">{user.name}</em> 👋
            </h2>
            <p className="type-lede max-w-[520px]">
              {totals.done > 0 ? (
                <>
                  {totals.done}{" "}
                  {pluralRu(totals.done, "пробежка", "пробежки", "пробежек")}{" "}
                  в&nbsp;этом месяце — так&nbsp;держать!&nbsp;🔥
                </>
              ) : (
                <>В&nbsp;этом месяце пока ни&nbsp;одной — среда близко, ждём!&nbsp;👟</>
              )}
            </p>
          </div>
          <Image
            src="/brand/character.png"
            alt=""
            width={112}
            height={112}
            className="hidden h-24 w-24 shrink-0 object-contain sm:block"
          />
        </div>

        {/* Progress toward the next reward — links earn → redeem */}
        {showNudge ? (
          <Link
            href="/shop"
            className="mb-6 flex flex-col gap-2 rounded-3xl bg-brand-yellow-tint p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3 text-[14px] font-semibold text-ink">
              <span>
                До «{progress!.rewardTitle}» · {progress!.partnerName}
              </span>
              <span className="whitespace-nowrap text-brand-red">ещё {remaining} Б</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-yellow/25">
              <div
                className="h-full rounded-full bg-brand-yellow"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[12px] text-graphite">
              {progress!.balance} из {progress!.cost} баллов
            </span>
          </Link>
        ) : null}

        {/* This month's runs */}
        <div className="mb-3 flex items-center justify-between">
          <span className="type-mono-caps">{monthLabel} · твои пробежки</span>
          <span className="font-mono text-[13px] font-medium tracking-[0.04em]">
            <b className="text-brand-red">{totals.done}</b>
            <span className="text-muted">
              {" "}
              из {totals.total}
              {totals.done > 0 ? ` · ${totals.progressPct}%` : ""}
            </span>
          </span>
        </div>

        {cells.length === 0 ? (
          <div className="rounded-3xl bg-paper p-6 text-[14px] text-graphite">
            На&nbsp;этот месяц пока нет событий — ждём расписание.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cells.map((cell) => (
              <TimelineCellView key={cell.date} cell={cell} nextEvent={nextEvent} />
            ))}
          </div>
        )}

        {/* KPIs */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-3xl bg-paper p-5">
            <span className="type-mono-caps">Пробежек</span>
            <span className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">
              {totals.done}
            </span>
            <span className="text-[12px] text-muted">за {monthLabel}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-3xl bg-paper p-5 ring-2 ring-brand-yellow">
            <span className="type-mono-caps">Баллов</span>
            <span className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-[#B8860B]">
              {totalPoints}
            </span>
            <span className="text-[12px] text-muted">за {monthLabel}</span>
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
  // Soft rounded cards on the warm section ground; each state gets its own
  // fill so the grid reads as a friendly calendar, not a table of outlines.
  const SHELL =
    "flex h-full min-h-[7rem] flex-col gap-1.5 rounded-3xl p-4 transition-transform hover:-translate-y-0.5";

  const isSpecial = cell.eventType === "special";
  const SpecialBadge = isSpecial ? (
    <Badge variant="primary" className="ml-1">
      спец
    </Badge>
  ) : null;

  if (cell.kind === "today" || cell.kind === "tomorrow" || cell.kind === "soon") {
    const time = nextEvent?.time ?? cell.time;
    const badge =
      cell.kind === "today" ? "СЕГОДНЯ" : cell.kind === "tomorrow" ? "ЗАВТРА" : "ОЖИДАЕТСЯ";
    const showRsvp = !isSpecial;
    const isGoing = cell.isGoing === true;
    return (
      <Link
        href={`/events/${encodeURIComponent(cell.eventId)}`}
        className={`${SHELL} bg-brand-red text-paper hover:bg-brand-red-ink`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
            {cell.dateLabel}
          </span>
          <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
            {badge}
          </span>
        </div>
        <span className="font-display text-[18px] font-bold leading-tight">{cell.title}</span>
        <span className="font-mono text-[20px] font-medium leading-none tracking-[0.04em] opacity-95">
          {time}
        </span>
        {showRsvp ? (
          isGoing ? (
            <span className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 font-sans text-[14px] font-bold tracking-tight text-paper">
              <span aria-hidden className="font-mono text-[16px]">✓</span>
              Я иду
            </span>
          ) : (
            <span className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-paper px-4 font-sans text-[14px] font-bold tracking-tight text-brand-red">
              Я иду →
            </span>
          )
        ) : null}
      </Link>
    );
  }

  if (cell.kind === "done") {
    return (
      <Link
        href={`/events/${encodeURIComponent(cell.eventId)}`}
        className={`${SHELL} bg-brand-yellow-tint text-ink`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-graphite">
            {cell.dateLabel}
          </span>
          {SpecialBadge}
        </div>
        <div className="flex items-center gap-2">
          <span
            aria-label="засчитано"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-mono text-[14px] font-bold leading-none text-ink"
          >
            ✓
          </span>
          <span className="font-display text-[20px] font-bold leading-none text-ink">
            {cell.title}
          </span>
        </div>
        {cell.points ? (
          <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-brand-yellow/35 px-2.5 py-1 font-mono text-[12px] font-bold text-[#8A6D00]">
            + {cell.points} Б
          </span>
        ) : (
          <span className="font-mono text-[12px] font-medium text-graphite">засчитано</span>
        )}
      </Link>
    );
  }

  if (cell.kind === "upcoming") {
    return (
      <Link
        href={`/events/${encodeURIComponent(cell.eventId)}`}
        className={`${SHELL} bg-paper text-muted`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            {cell.dateLabel}
          </span>
          {SpecialBadge}
        </div>
        <span className="font-display text-[22px] font-bold leading-none text-ink">
          {isSpecial ? cell.title : "ожидается"}
        </span>
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
          {isSpecial ? "ожидается" : `старт ${cell.time}`}
        </span>
      </Link>
    );
  }

  // kind === "skipped" — muted, encouraging, no strikethrough "failure diary".
  return (
    <Link
      href={`/events/${encodeURIComponent(cell.eventId)}`}
      className={`${SHELL} bg-paper-2 text-muted`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {cell.dateLabel}
        </span>
        {SpecialBadge}
      </div>
      <span className="font-display text-[22px] font-bold leading-none text-muted-2">
        пропуск
      </span>
      <span className="text-[12px] text-muted">в&nbsp;следующий раз!</span>
    </Link>
  );
}
// Re-export mock-cell type to keep callers (if any) compiling — we still use
// the static mock fallback through mockTimeline() above.
export type { WeekCellMockT };
