"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { AdminPartner } from "@/lib/api-admin";

type ActionResult = { ok: true } | { ok: false; message: string };
type Action = (
  prev: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

type Defaults = {
  slug?: string;
  partnerId?: string;
  title?: string;
  description?: string | null;
  costPoints?: number;
  badge?: string | null;
  status?: "active" | "archived";
  validFrom?: string | null;
  validUntil?: string | null;
  capacity?: number | null;
};

function fmtDateForInput(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export function RewardForm({
  action,
  defaults,
  submitLabel,
  partners,
}: {
  action: Action;
  defaults?: Defaults;
  submitLabel: string;
  partners: AdminPartner[];
}) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  if (partners.length === 0) {
    return (
      <div className="flex flex-col gap-3 border border-ink bg-paper-2 p-6">
        <span className="type-mono-caps">партнёров нет</span>
        <p className="text-[14px] leading-[1.55] text-graphite">
          Сначала создай хотя бы одного партнёра — без него нельзя добавить
          награду.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Партнёр">
        <select
          name="partnerId"
          required
          defaultValue={defaults?.partnerId ?? partners[0]?.id}
          className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
        >
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.slug}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Slug" hint="lowercase, hyphens">
        <input
          name="slug"
          required
          defaultValue={defaults?.slug}
          placeholder="mg-cappuccino"
          className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <Field label="Название">
        <input
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder="Капучино"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <Field label="Описание" hint="опционально">
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults?.description ?? undefined}
          className="border border-ink bg-paper px-3 py-2 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Цена, баллов" hint="≥ 1">
          <input
            name="costPoints"
            type="number"
            min={1}
            required
            defaultValue={defaults?.costPoints}
            placeholder="120"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Капасити" hint="опционально, лимит обменов">
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={defaults?.capacity ?? undefined}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
          />
        </Field>
      </div>
      <Field label="Бейдж" hint="короткая метка, опционально">
        <input
          name="badge"
          defaultValue={defaults?.badge ?? undefined}
          placeholder="до 31 мая"
          maxLength={60}
          className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Действует с" hint="ISO date или пусто">
          <input
            name="validFrom"
            type="date"
            defaultValue={fmtDateForInput(defaults?.validFrom)}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Действует до">
          <input
            name="validUntil"
            type="date"
            defaultValue={fmtDateForInput(defaults?.validUntil)}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
          />
        </Field>
      </div>
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
