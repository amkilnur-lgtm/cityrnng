"use client";

import { useState, useTransition } from "react";
import { markGoingAction } from "@/app/events/[id]/interest-actions";

/**
 * RSVP-кнопка на странице локации. Записывает текущего юзера на эту точку
 * (или переносит с другой) одним кликом. Кнопка делает оптимистичный
 * disabled-стейт, при ошибке показывает сообщение под собой.
 */
export function LocationRsvpButton({
  eventKey,
  locationId,
  label,
}: {
  eventKey: string;
  locationId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const r = await markGoingAction(eventKey, locationId);
      if (!r.ok) setError(r.message);
      // На успехе revalidatePath перерисует страницу с iAmGoingHere=true.
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-12 items-center gap-2 border-2 border-brand-red bg-brand-red px-5 font-sans text-[15px] font-bold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Записываем…" : label}
      </button>
      {error ? (
        <p role="alert" className="text-[12px] text-brand-red-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
