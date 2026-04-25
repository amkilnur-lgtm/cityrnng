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
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
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
              В&nbsp;прошлую среду ты&nbsp;пробежала{" "}
              <b className="font-semibold text-ink">{lastKm}&nbsp;км</b>{" "}
              и&nbsp;получила{" "}
              <b className="font-semibold text-ink">
                +{lastPoints}&nbsp;баллов
              </b>
              . Завтра — {DISTANCE_RANGE} на&nbsp;выбор в&nbsp;19:30.
            </p>
          </div>
          <Link
            href="/events/w-22"
            className="inline-flex h-14 items-center border border-ink bg-paper px-6 font-sans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Маршрут и&nbsp;точка старта →
          </Link>
        </div>

        <div className="border border-ink bg-paper">
          <div className="flex items-center justify-between border-b border-ink px-5 py-4 md:px-6">
            <span className="type-mono-caps">апрель · твои пробежки</span>
            <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-ink">
              <b className="text-brand-red">{done}</b>
              <span className="text-muted-2">
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

          <div className="grid grid-cols-2 divide-ink border-t border-ink md:grid-cols-4 md:divide-x">
            {[
              { k: "Сред", v: `${done}`, s: "в этом месяце" },
              { k: "Километров", v: `${km}`, s: "за апрель" },
              { k: "Часов в пути", v: "1:02", s: "всего" },
              { k: "Средний темп", v: "6:38", s: "мин/км" },
            ].map((kpi, i) => (
              <div
                key={kpi.k}
                className={
                  "flex flex-col gap-1 px-5 py-4 md:px-6 md:py-5" +
                  (i % 2 !== 0 ? " border-l border-ink md:border-l-0" : "") +
                  (i >= 2 ? " border-t border-ink md:border-t-0" : "")
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
    const place = nextEvent?.venue ?? cell.place;
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
        <span className="text-[13px] leading-tight opacity-90">
          {place ?? "место уточняется"}
        </span>
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
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-2">
        {cell.weekday}&nbsp;·&nbsp;{cell.date}
      </span>
      <span className="font-display text-[24px] font-bold leading-none text-muted-2 line-through decoration-muted-2">
        пропуск
      </span>
      <span className="text-[12px] text-muted-2">без&nbsp;баллов</span>
    </div>
  );
}
