"use client";

import { useState, useTransition } from "react";
import {
  cancelGoingAction,
  markGoingAction,
} from "@/app/events/[id]/interest-actions";

export type EventLocation = {
  id: string;
  name: string;
  city: string;
};

type Props = {
  eventKey: string;
  locations: EventLocation[];
  /** Currently chosen location id from server, or null if user hasn't RSVPed. */
  myLocationId: string | null;
  /** Per-location RSVP counts ("N идут"). */
  countsByLocation: Record<string, number>;
};

/**
 * "Я иду" RSVP block on event detail. Authed-only — guests see a login
 * prompt elsewhere on the page and don't render this. Picks one of the
 * event's start locations and posts the intent. Cancellation flips the
 * row to status=cancelled server-side.
 */
export function EventRsvp({
  eventKey,
  locations,
  myLocationId,
  countsByLocation,
}: Props) {
  const isGoing = myLocationId !== null;
  const [chosen, setChosen] = useState<string | null>(myLocationId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    });
  }

  if (isGoing) {
    const loc = locations.find((l) => l.id === myLocationId);
    return (
      <div className="flex flex-col gap-3 border border-brand-red bg-brand-tint/40 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 bg-brand-red" />
          <span className="type-mono-caps text-brand-red">я иду</span>
        </div>
        <p className="text-[15px] leading-[1.55] text-ink">
          Записан с&nbsp;точки{" "}
          <b className="font-semibold">{loc?.name ?? "—"}</b>. Темп
          и&nbsp;дистанцию выберешь на&nbsp;месте.
        </p>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="self-start font-sans text-[14px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-60"
        >
          {pending ? "Отменяем…" : "Отменить запись"}
        </button>
        {error ? (
          <p role="alert" className="text-[13px] text-brand-red-ink">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-ink bg-paper p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <span className="type-mono-caps">я иду</span>
        <p className="text-[14px] leading-[1.5] text-graphite">
          Выбери точку старта — нажмёшь и&nbsp;ты в&nbsp;списке.
          Темп и&nbsp;дистанцию решишь у&nbsp;точки.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {locations.map((loc) => {
          const count = countsByLocation[loc.id] ?? 0;
          const active = chosen === loc.id;
          return (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => setChosen(loc.id)}
                aria-pressed={active}
                className={
                  "flex w-full items-center justify-between border px-4 py-3 text-left text-[14px] transition-colors " +
                  (active
                    ? "border-brand-red bg-brand-tint/40 text-ink"
                    : "border-ink/30 bg-paper text-ink hover:border-ink")
                }
              >
                <span className="font-semibold">{loc.name}</span>
                <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
                  {count > 0 ? `${count} идут` : "будь первым"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={submit}
        disabled={pending || !chosen}
        className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:bg-muted-2 disabled:text-paper"
      >
        {pending ? "Записываемся…" : "Я иду →"}
      </button>

      {error ? (
        <p role="alert" className="text-[13px] text-brand-red-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
