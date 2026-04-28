"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfileAction } from "@/app/app/profile/actions";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

type Defaults = {
  displayName?: string;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  telegramHandle?: string | null;
  instagramHandle?: string | null;
};

export function ProfileEditForm({
  defaults,
  cityFallback,
}: {
  defaults: Defaults;
  cityFallback: string;
}) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Имя для отображения" hint="видно в шапке и в дашборде">
        <input
          name="displayName"
          required
          defaultValue={defaults.displayName ?? ""}
          maxLength={80}
          placeholder="Маша"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Имя">
          <input
            name="firstName"
            defaultValue={defaults.firstName ?? ""}
            maxLength={80}
            placeholder="Мария"
            className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Фамилия">
          <input
            name="lastName"
            defaultValue={defaults.lastName ?? ""}
            maxLength={80}
            placeholder="Иванова"
            className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>

      <Field label="Город">
        <input
          name="city"
          defaultValue={defaults.city ?? ""}
          maxLength={80}
          placeholder={cityFallback}
          className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Telegram" hint="@handle или ссылка">
          <input
            name="telegramHandle"
            defaultValue={defaults.telegramHandle ?? ""}
            maxLength={64}
            placeholder="@cityrnng"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Instagram" hint="@handle">
          <input
            name="instagramHandle"
            defaultValue={defaults.instagramHandle ?? ""}
            maxLength={64}
            placeholder="@cityrnng"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>

      {state?.ok ? (
        <p className="border border-brand-red bg-brand-tint/30 px-3 py-2 font-mono text-[12px] text-ink">
          ✓ Сохранили.
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
      {pending ? "Сохраняем…" : "Сохранить"}
    </button>
  );
}
