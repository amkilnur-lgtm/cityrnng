import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE, pointsForDistance } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";
import {
  WEEK_CELLS,
  type AuthedUser,
  type WeekCell as WeekCellT,
} from "@/lib/home-mock";

export function PersonalDashboard({
  user,
  nextEvent,
}: {
  user: AuthedUser;
  nextEvent?: DisplayEvent;
}) {
  const doneCells = WEEK_CELLS.filter((w) => w.kind === "done");
  const done = doneCells.length;
  const totalScheduled = WEEK_CELLS.length;
  const km = doneCells.reduce((s, w) => s + (w.km ?? 0), 0);
  const progressPct = Math.round((done / totalScheduled) * 100);
  const lastDone = [...doneCells].pop();
  const lastKm = lastDone?.km ?? 0;
  const lastPoints = lastKm ? pointsForDistance(lastKm) : 0;

  return (
    <section className="border-b border-ink bg-paper-2/60">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-px w-9 bg-ink" />
            <span className="type-mono-caps">
              Вторник · 21&nbsp;апреля · {CLUB.city}
            </span>
          </div>
          <h2 className="type-h2">
            Привет, <em className="not-italic text-brand-red">{user.name}</em>.
            <br />
            До&nbsp;среды 1&nbsp;день.
          </h2>
          <p className="type-lede max-w-[560px]">
            На&nbsp;прошлой среде —{" "}
            <b className="font-semibold text-ink">{lastKm}&nbsp;км</b>,{" "}
            <b className="font-semibold text-ink">+{lastPoints}&nbsp;Б</b>.
            Завтра в&nbsp;19:30 ждём снова.
          </p>
        </div>

        <div className="border border-ink bg-paper">
          <div className="flex items-center justify-between border-b border-ink px-5 py-4 md:px-6">
            <span className="type-mono-caps">апрель · твои пробежки</span>
            <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-ink">
              <b className="text-brand-red">{done}</b>
              <span className="text-muted">
                {" "}
                из {totalScheduled} пробежек · {progressPct}%
              </span>
            </span>
          </div>

          <div className="h-1 w-full bg-paper-2">
            <div
              className="h-full bg-brand-red"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 divide-y divide-ink md:grid-cols-4 md:divide-x md:divide-y-0">
            {WEEK_CELLS.map((w) => (
              <WeekCellView key={w.date} cell={w} nextEvent={nextEvent} />
            ))}
          </div>

          <div className="grid grid-cols-2 divide-ink border-t border-ink md:divide-x">
            {[
              { k: "Пробежек", v: `${done}`, s: "в этом месяце" },
              { k: "Километров", v: `${km}`, s: "за апрель" },
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

function WeekCellView({
  cell,
  nextEvent,
}: {
  cell: WeekCellT;
  nextEvent?: DisplayEvent;
}) {
  if (cell.kind === "tomorrow") {
    const time = nextEvent?.time ?? cell.time;
    return (
      <div className="flex flex-col gap-2 bg-brand-red px-5 py-5 text-paper md:px-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
            {cell.weekday}&nbsp;·&nbsp;{cell.date}
          </span>
          <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
            ЗАВТРА
          </span>
        </div>
        <span className="font-display text-[24px] font-bold leading-tight">
          {time}
        </span>
        <Link
          href={nextEvent ? `/events/${nextEvent.id}` : "/events"}
          className="font-sans text-[14px] font-semibold leading-tight text-paper underline-offset-4 hover:underline"
        >
          Маршрут и&nbsp;точка старта →
        </Link>
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] opacity-90">
          {DISTANCE_RANGE} · выбираешь на&nbsp;старте
        </span>
      </div>
    );
  }

  if (cell.kind === "done") {
    return (
      <div className="hatch-done flex flex-col gap-2 px-5 py-5 text-ink md:px-6">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {cell.weekday}&nbsp;·&nbsp;{cell.date}
        </span>
        <span className="font-display text-[24px] font-bold leading-none text-ink">
          {cell.km}&nbsp;км
        </span>
        <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-brand-red">
          + {cell.points}&nbsp;Б
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 bg-paper-2 px-5 py-5 md:px-6">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {cell.weekday}&nbsp;·&nbsp;{cell.date}
      </span>
      <span className="font-display text-[24px] font-bold leading-none text-muted-2 line-through decoration-muted-2">
        пропуск
      </span>
      <span className="text-[12px] text-muted">без&nbsp;баллов</span>
    </div>
  );
}
