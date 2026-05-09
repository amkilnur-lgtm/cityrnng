"use client";

import { useState, useTransition } from "react";
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
  name: string;
  city: string;
  paceGroups?: EventPaceGroup[];
};

type Props = {
  eventKey: string;
  locations: EventLocation[];
  /** Currently chosen location id from server, or null if user hasn't RSVPed. */
  myLocationId: string | null;
  /** Per-location RSVP counts ("N идут"). */
  countsByLocation: Record<string, number>;
  /** When false, render read-only cards (guest view). */
  isAuthed: boolean;
  /**
   * "full" (default) — locations show pace groups inside each card; used
   * on the event detail page. "compact" — name + count only; used on the
   * home next-event card where vertical space is scarce.
   */
  variant?: "full" | "compact";
};

function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function goingLabel(count: number, isMine: boolean): string | null {
  if (count === 0) return "будь первым";
  if (isMine) {
    if (count === 1) return "ты идёшь";
    return `ты и ещё ${count - 1} идут`;
  }
  return `${count} идут`;
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
  countsByLocation,
  isAuthed,
  variant = "full",
}: Props) {
  const [chosen, setChosen] = useState<string | null>(myLocationId);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-mono-caps">точки старта</span>
        {isAuthed ? (
          <span className="text-[12px] text-muted">
            Темп и&nbsp;дистанцию выберешь у&nbsp;точки.
          </span>
        ) : null}
      </div>

      {isGoing ? (
        <div className="flex items-center gap-2.5 border border-brand-red bg-brand-red px-4 py-2.5 text-paper">
          <span className="block h-2 w-2 bg-paper" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">
            ты идёшь
          </span>
          <span className="ml-auto font-sans text-[13px] font-medium">
            точка{" "}
            {locations.find((l) => l.id === myLocationId)?.name ?? "—"}
          </span>
        </div>
      ) : null}

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

              {variant === "full" ? (
                loc.paceGroups && loc.paceGroups.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {loc.paceGroups.map((pg) => (
                      <li
                        key={pg.id}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="font-mono tracking-[0.02em] text-ink">
                          {pg.distanceKm}&nbsp;км ·{" "}
                          {formatPace(pg.paceSecondsPerKm)}
                        </span>
                        {pg.pacerName ? (
                          <span className="truncate text-[12px] text-muted">
                            с {pg.pacerName}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[12px] leading-tight text-muted">
                    Без пейсера — темп по&nbsp;самочувствию
                  </span>
                )
              ) : null}
            </>
          );

          const cardPad =
            variant === "compact" ? "gap-2 p-3" : "gap-3 p-4";

          return (
            <li key={loc.id}>
              {isAuthed ? (
                <button
                  type="button"
                  onClick={() => setChosen(loc.id)}
                  aria-pressed={isChosen}
                  className={`flex h-full w-full flex-col border text-left transition-colors ${cardPad} ${accent} ${interactive}`}
                >
                  {inner}
                </button>
              ) : (
                <div
                  className={`flex h-full w-full flex-col border ${cardPad} ${accent}`}
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!isAuthed ? null : isGoing && movingTo === null ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="font-sans text-[14px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-60"
          >
            {pending ? "Отменяем…" : "Отменить запись"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={pending || !chosen}
            className="inline-flex h-12 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? "Записываемся…"
              : movingTo
                ? "Перенести точку →"
                : "Я иду →"}
          </button>
          {!chosen ? (
            <span className="text-[13px] text-muted">
              Сначала выбери одну из&nbsp;точек.
            </span>
          ) : null}
          {movingTo ? (
            <button
              type="button"
              onClick={() => setChosen(myLocationId)}
              disabled={pending}
              className="font-sans text-[14px] font-medium text-graphite underline-offset-4 hover:text-ink hover:underline"
            >
              Оставить как было
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
