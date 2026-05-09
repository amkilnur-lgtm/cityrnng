"use client";

import { useTransition } from "react";
import { cancelGoingAction } from "@/app/events/[id]/interest-actions";

export function CancelRsvpButton({ eventKey }: { eventKey: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await cancelGoingAction(eventKey);
        });
      }}
      disabled={pending}
      className="font-sans text-[13px] font-medium text-graphite underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-60"
    >
      {pending ? "Отменяем…" : "Отменить запись"}
    </button>
  );
}
