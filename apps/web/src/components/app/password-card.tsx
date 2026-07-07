"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setPasswordAction } from "@/app/app/profile/actions";

const INPUT =
  "h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30";

export function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useFormState(setPasswordAction, undefined);

  return (
    <div className="flex flex-col gap-4 border border-ink bg-paper p-6 md:p-8">
      <span className="type-mono-caps">пароль</span>
      <h3 className="type-h3">
        {hasPassword ? "Сменить пароль" : "Задать пароль"}
      </h3>
      <p className="text-[13px] leading-[1.5] text-graphite">
        {hasPassword
          ? "Обновить пароль для входа."
          : "У аккаунта пока нет пароля — задай, чтобы входить без письма, прямо в одной вкладке."}
      </p>

      <form action={formAction} className="flex flex-col gap-3">
        {hasPassword ? (
          <label className="flex flex-col gap-1.5">
            <span className="type-label">Текущий пароль</span>
            <input
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
              className={INPUT}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className="type-label">Новый пароль</span>
          <input
            type="password"
            name="newPassword"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="минимум 8 символов"
            className={INPUT}
          />
        </label>

        {state?.ok ? (
          <p className="border border-brand-red bg-brand-tint/30 px-3 py-2 font-mono text-[12px] text-ink">
            ✓ Пароль сохранён
          </p>
        ) : null}
        <p
          role="alert"
          aria-live="polite"
          className={
            state && !state.ok
              ? "border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink"
              : "sr-only"
          }
        >
          {state && !state.ok ? state.message : ""}
        </p>

        <SubmitButton hasPassword={hasPassword} />
      </form>
    </div>
  );
}

function SubmitButton({ hasPassword }: { hasPassword: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center self-start border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
    >
      {pending ? "Сохраняем…" : hasPassword ? "Сменить пароль" : "Задать пароль"}
    </button>
  );
}
