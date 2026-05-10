"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

type Result = { ok: true; message?: string } | { ok: false; message: string };
type Action = (
  prev: Result | undefined,
  formData: FormData,
) => Promise<Result>;

export function RedemptionCancelForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState<Result | undefined, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Причина отмены (необязательно)
        </span>
        <textarea
          name="reason"
          rows={3}
          placeholder="Например: пользователь не пришёл за наградой, ошибка списания и т.п."
          className="border border-ink bg-paper px-3 py-2 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <Submit />
        <Link
          href="/admin/redemptions"
          className="inline-flex h-12 items-center px-3 font-sans text-[14px] font-medium text-graphite hover:text-brand-red"
        >
          Назад
        </Link>
      </div>
      {state?.ok ? (
        <p className="font-mono text-[12px] tracking-[0.04em] text-brand-red">
          ✓ {state.message ?? "Готово."}
        </p>
      ) : null}
      {state && !state.ok ? (
        <p
          role="alert"
          className="font-mono text-[12px] tracking-[0.04em] text-brand-red-ink"
        >
          ✗ {state.message}
        </p>
      ) : null}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:opacity-60"
    >
      {pending ? "Отменяем…" : "Отменить и вернуть баллы"}
    </button>
  );
}
