"use client";

import { useFormState, useFormStatus } from "react-dom";

type ActionResult = { ok: true } | { ok: false; message: string };
type Action = (
  prev: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

type Defaults = {
  slug?: string;
  name?: string;
  description?: string | null;
  contactEmail?: string | null;
  status?: "active" | "archived";
};

export function PartnerForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Slug" hint="lowercase, hyphens">
        <input
          name="slug"
          required
          defaultValue={defaults?.slug}
          placeholder="monkey-grinder"
          className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <Field label="Название">
        <input
          name="name"
          required
          defaultValue={defaults?.name}
          placeholder="Monkey Grinder"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <Field label="Описание" hint="опционально, до 2000 символов">
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? undefined}
          className="border border-ink bg-paper px-3 py-2 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <Field label="Email" hint="контакт партнёра">
        <input
          name="contactEmail"
          type="email"
          defaultValue={defaults?.contactEmail ?? undefined}
          placeholder="hello@monkey-grinder.ru"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <Field label="Статус">
        <select
          name="status"
          defaultValue={defaults?.status ?? "active"}
          className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
        >
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
      </Field>

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

      <SubmitButton label={submitLabel} />
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
    >
      {pending ? "Сохраняем…" : label}
    </button>
  );
}
