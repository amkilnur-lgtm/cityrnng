"use client";

import { useState, useTransition } from "react";
import {
  approveAttendanceAction,
  rejectAttendanceAction,
} from "@/app/admin/attendances/actions";

export function AttendanceActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveAttendanceAction(id);
      if (!result.ok) setError(result.message);
    });
  }

  function reject() {
    const reason = prompt("Причина отказа?", "Активность вне окна события");
    if (reason === null) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectAttendanceAction(id, reason);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="inline-flex h-8 items-center border border-brand-red bg-brand-red px-3 font-sans text-[12px] font-semibold text-paper hover:bg-brand-red-ink disabled:opacity-50"
        >
          Одобрить
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={pending}
          className="inline-flex h-8 items-center border border-ink bg-paper px-3 font-sans text-[12px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          Отклонить
        </button>
      </div>
      {error ? (
        <span className="font-mono text-[10px] text-brand-red-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}
