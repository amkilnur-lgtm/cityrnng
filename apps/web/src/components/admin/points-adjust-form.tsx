"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adjustPointsAction } from "@/app/admin/points/actions";

type ActionResult =
  | { ok: true; balance: number }
  | { ok: false; message: string };

export function PointsAdjustForm({ defaultUserId }: { defaultUserId?: string }) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    adjustPointsAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="User ID" hint="UUID — копируй из таблицы пользователей">
        <input
          name="userId"
          required
          defaultValue={defaultUserId}
          placeholder="00000000-0000-0000-0000-000000000000"
          className="h-11 border border-ink bg-paper px-3 font-mono text-[12px] outline-none focus:bg-brand-tint/30"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
        <Field label="Направление">
          <select
            name="direction"
            defaultValue="credit"
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none"
          >
            <option value="credit">credit (+)</option>
            <option value="debit">debit (−)</option>
          </select>
        </Field>
        <Field label="Сумма" hint="целое число ≥ 1">
          <input
            name="amount"
            type="number"
            min={1}
            required
            placeholder="50"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>

      <Field label="Комментарий" hint="попадёт в аудит — описывай причину">
        <input
          name="comment"
          required
          placeholder="Корректировка после ручного check-in 25.04"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none focus:bg-brand-tint/30"
        />
      </Field>

      {state?.ok ? (
        <p className="border border-brand-red bg-brand-tint/30 px-3 py-2 font-mono text-[12px] text-ink">
          ✓ Готово. Новый баланс: {state.balance}&nbsp;Б
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="type-label flex items-center justify-between">
        {label}
        {hint ? (
          <span className="font-mono text-[11px] font-normal text-muted">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
    >
      {pending ? "Применяем…" : "Корректировка"}
    </button>
  );
}
