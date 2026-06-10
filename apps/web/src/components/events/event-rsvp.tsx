"use client";

import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import {
  cancelGoingAction,
  markGoingAction,
} from "@/app/events/[id]/interest-actions";

export type EventPaceGroup = {
  id: string;
  distanceKm: number;
  paceSecondsPerKm: number;
  pacerName: string | null;
};

export type EventLocation = {
  id: string;
  slug: string;
  name: string;
  city: string;
  paceGroups?: EventPaceGroup[];
};

type Props = {
  eventKey: string;
  locations: EventLocation[];
  /** Currently chosen location id from server, or null if user hasn't RSVPed. */
  myLocationId: string | null;
  /**
   * Attendance state for the current user. When set, the user has been
   * credited for this event already (Strava match landed) — we hide the
   * "Отменить запись" action and show a static "Ты бежал" panel instead,
   * because attendance is a historical fact that shouldn't be undone by
   * cancelling the RSVP.
   */
  myAttended?: { km: number | null; points: number | null } | null;
  /** Per-location RSVP counts ("N идут"). */
  countsByLocation: Record<string, number>;
  /** When false, render read-only cards (guest view). */
  isAuthed: boolean;
};

function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Group pace groups by distance, returning entries sorted longest first. */
function groupByDistance(
  paceGroups: EventPaceGroup[],
): Array<[number, EventPaceGroup[]]> {
  const map = new Map<number, EventPaceGroup[]>();
  for (const pg of paceGroups) {
    const arr = map.get(pg.distanceKm) ?? [];
    arr.push(pg);
    map.set(pg.distanceKm, arr);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

/** Russian plural for "идут/идёт" by count (1, 21, 31 → singular; rest → plural). */
function verbGoing(count: number): "идёт" | "идут" {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "идут";
  return mod10 === 1 ? "идёт" : "идут";
}

function goingLabel(count: number, isMine: boolean): string | null {
  if (count === 0) return "будь первым";
  if (isMine) {
    if (count === 1) return "ты идёшь";
    const others = count - 1;
    return `ты и ещё ${others} ${verbGoing(others)}`;
  }
  return `${count} ${verbGoing(count)}`;
}

/**
 * Unified event-locations block: each starting point is a card showing its
 * pace groups + live "N идут" counter. For authed users the cards are
 * pickable and the block submits an RSVP. Guests see the same info read-only.
 */
export function EventRsvp({
  eventKey,
  locations,
  myLocationId,
  myAttended = null,
  countsByLocation,
  isAuthed,
}: Props) {
  // Pre-select when there's only one location — saves a tap (no point in
  // making the user explicitly "pick" the only option).
  const [chosen, setChosen] = useState<string | null>(
    myLocationId ?? (locations.length === 1 ? locations[0].id : null),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isGoing = myLocationId !== null;
  const movingTo =
    isGoing && chosen !== null && chosen !== myLocationId ? chosen : null;

  function submit() {
    if (!chosen) {
      setError("Выбери точку старта.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await markGoingAction(eventKey, chosen);
      if (!res.ok) setError(res.message);
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelGoingAction(eventKey);
      if (!res.ok) setError(res.message);
      else setChosen(null);
    });
  }

  // Single-location event = no point in showing a "точки старта" picker;
  // chosen is already auto-set, just render the action button.
  const isSingleLocation = locations.length === 1;

  return (
    <div className="flex flex-col gap-4">
      {!isSingleLocation ? (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <span className="type-mono-caps">точки старта</span>
            {isAuthed ? (
              <span className="text-[12px] text-muted">
                Темп и&nbsp;дистанцию выберешь у&nbsp;точки.
              </span>
            ) : null}
          </div>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {locations.map((loc) => {
          const count = countsByLocation[loc.id] ?? 0;
          const isChosen = chosen === loc.id;
          const isMine = myLocationId === loc.id;
          const accent = isChosen
            ? "border-brand-red bg-brand-tint/40"
            : isMine
              ? "border-brand-red/50 bg-paper"
              : "border-ink/30 bg-paper";
          const interactive = isAuthed
            ? "cursor-pointer hover:border-ink"
            : "";

          const label = goingLabel(count, isMine);
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="font-sans text-[15px] font-semibold leading-tight text-ink">
                  {loc.name}
                </span>
                {label ? (
                  <span className="whitespace-nowrap font-mono text-[11px] tracking-[0.04em] text-brand-red">
                    {label}
                  </span>
                ) : null}
              </div>

              {loc.paceGroups && loc.paceGroups.length > 0 ? (
                <div className="flex flex-col gap-1 font-mono text-[13px] tracking-[0.02em]">
                  {groupByDistance(loc.paceGroups).map(([dist, paces]) => (
                    <div
                      key={dist}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1"
                    >
                      <span className="text-ink">{dist}&nbsp;км</span>
                      {paces.map((pg) => (
                        <Fragment key={pg.id}>
                          <span aria-hidden className="text-ink/25">|</span>
                          <span className="text-ink">
                            {formatPace(pg.paceSecondsPerKm)}
                            {pg.pacerName ? (
                              <span className="text-muted">
                                {" "}
                                (с&nbsp;{pg.pacerName})
                              </span>
                            ) : null}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] leading-tight text-muted">
                  Без пейсера — темп по&nbsp;самочувствию
                </span>
              )}
            </>
          );

          // Если юзер уже идёт на ЭТУ точку — карточка становится ссылкой
          // на /events/[id]/where/[slug]: статус «ты идёшь сюда» уже понятен
          // из бейджа, тап даёт страницу с картой и списком. Чтобы перейти
          // на другую — тапает не свою карточку, и жмёт «Перенести точку».
          return (
            <li key={loc.id}>
              {isAuthed && isMine ? (
                <Link
                  href={`/events/${encodeURIComponent(eventKey)}/where/${encodeURIComponent(loc.slug)}`}
                  aria-label={`Открыть точку «${loc.name}»`}
                  className={`flex h-full w-full flex-col gap-3 border p-4 text-left transition-colors ${accent} cursor-pointer hover:border-ink`}
                >
                  {inner}
                </Link>
              ) : isAuthed ? (
                <button
                  type="button"
                  onClick={() => setChosen(loc.id)}
                  aria-pressed={isChosen}
                  className={`flex h-full w-full flex-col gap-3 border p-4 text-left transition-colors ${accent} ${interactive}`}
                >
                  {inner}
                </button>
              ) : (
                <div className={`flex h-full w-full flex-col gap-3 border p-4 ${accent}`}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
          </ul>
        </>
      ) : null}

      {!isAuthed ? null : myAttended ? (
        // Attended already — RSVP cancel is meaningless (you can't unrun a run).
        // Show the credited result as a static, terminal panel.
        <div className="flex flex-col gap-2">
          <div
            className="flex h-14 w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 border-2 border-ink bg-ink px-5 font-sans text-[16px] font-bold tracking-tight text-paper"
            role="status"
          >
            <span>Ты бежал это событие</span>
            <span aria-hidden className="font-mono text-[18px]">✓</span>
          </div>
          {myAttended.km != null || myAttended.points != null ? (
            <div className="flex flex-wrap items-center justify-center gap-x-4 font-mono text-[13px] tracking-[0.04em] text-graphite">
              {myAttended.km != null ? <span>{myAttended.km}&nbsp;км</span> : null}
              {myAttended.points != null ? (
                <span className="text-brand-red">+{myAttended.points}&nbsp;Б</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : isGoing && movingTo === null ? (
        <div className="flex flex-col gap-2">
          <div
            className="flex h-14 w-full items-center justify-center gap-3 border-2 border-ink bg-ink px-5 font-sans text-[16px] font-bold tracking-tight text-paper"
            role="status"
          >
            <span>Ты идёшь на&nbsp;это событие</span>
            <span aria-hidden className="font-mono text-[18px]">✓</span>
          </div>
          {/* Ссылка на страницу точки старта (адрес, карта, список идущих). */}
          {(() => {
            const mine = locations.find((l) => l.id === myLocationId);
            return mine ? (
              <Link
                href={`/events/${encodeURIComponent(eventKey)}/where/${encodeURIComponent(mine.slug)}`}
                className="self-center font-sans text-[13px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline"
              >
                открыть точку «{mine.name}» →
              </Link>
            ) : null;
          })()}
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="self-center font-sans text-[13px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-60"
          >
            {pending ? "отменяем…" : "отменить запись"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={pending || !chosen}
            className={
              "group inline-flex h-14 w-full items-center justify-center gap-3 border-2 px-5 font-sans text-[16px] font-bold tracking-tight transition-colors disabled:cursor-not-allowed " +
              (chosen
                ? "border-brand-red bg-brand-red text-paper hover:bg-brand-red-ink"
                : "border-ink/20 bg-paper text-muted")
            }
          >
            <span>
              {pending
                ? "Записываемся…"
                : movingTo
                  ? "Перенести точку"
                  : chosen
                    ? "Я иду"
                    : "Выбери точку"}
            </span>
            {!pending && chosen ? (
              <span
                aria-hidden
                className="font-mono text-[18px] transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            ) : null}
          </button>
          {movingTo ? (
            <button
              type="button"
              onClick={() => setChosen(myLocationId)}
              disabled={pending}
              className="self-center font-sans text-[13px] font-medium text-graphite underline-offset-4 hover:text-ink hover:underline"
            >
              оставить как было
            </button>
          ) : null}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-[13px] text-brand-red-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
