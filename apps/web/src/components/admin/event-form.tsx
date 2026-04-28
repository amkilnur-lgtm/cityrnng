"use client";

import { useFormState, useFormStatus } from "react-dom";

type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

type Action = (
  prev: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

type EventType = "regular" | "special" | "partner";
type EventStatus =
  | "draft"
  | "published"
  | "started"
  | "finished"
  | "cancelled";

type Defaults = {
  title?: string;
  slug?: string;
  description?: string | null;
  type?: EventType;
  status?: EventStatus;
  /** ISO strings — will be converted to <input datetime-local> format. */
  startsAt?: string;
  endsAt?: string;
  locationName?: string | null;
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  capacity?: number | null;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
  isPointsEligible?: boolean;
  basePointsAward?: number;
};

/**
 * <input type="datetime-local"> wants "YYYY-MM-DDTHH:MM" in *local* time.
 * Backend stores UTC; we render in the browser's local zone, which is
 * typically the admin's zone. Acceptable trade-off until we add a
 * tz-explicit picker.
 */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function EventForm({
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_240px]">
        <Field label="Название">
          <input
            name="title"
            required
            defaultValue={defaults?.title}
            placeholder="Утренний забег с пейсером"
            className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Slug" hint="lowercase, hyphens">
          <input
            name="slug"
            required
            defaultValue={defaults?.slug}
            placeholder="utrennij-zabeg-25-04"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>

      <Field label="Описание" hint="опционально">
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults?.description ?? ""}
          placeholder="5 км в комфортном темпе с пейсером 6:00/км. Сбор у Monkey Grinder."
          className="border border-ink bg-paper px-3 py-2 font-sans text-[14px] leading-[1.55] outline-none focus:bg-brand-tint/30"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Тип">
          <select
            name="type"
            defaultValue={defaults?.type ?? "special"}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none"
          >
            <option value="regular">regular</option>
            <option value="special">special</option>
            <option value="partner">partner</option>
          </select>
        </Field>
        <Field label="Статус">
          <select
            name="status"
            defaultValue={defaults?.status ?? "draft"}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="started">started</option>
            <option value="finished">finished</option>
            <option value="cancelled">cancelled</option>
          </select>
        </Field>
        <Field label="Вместимость" hint="пусто = без лимита">
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={defaults?.capacity ?? undefined}
            placeholder="20"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>

      <fieldset className="border border-ink p-5">
        <legend className="px-2 type-mono-caps">когда</legend>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Старт">
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(defaults?.startsAt)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Окончание">
            <input
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(defaults?.endsAt)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Регистрация открыта с" hint="опционально">
            <input
              name="registrationOpenAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaults?.registrationOpenAt)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Регистрация закрывается" hint="опционально">
            <input
              name="registrationCloseAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaults?.registrationCloseAt)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="border border-ink p-5">
        <legend className="px-2 type-mono-caps">где</legend>
        <div className="grid grid-cols-1 gap-5">
          <Field label="Название места" hint="«Парк Якутова»">
            <input
              name="locationName"
              defaultValue={defaults?.locationName ?? ""}
              className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Адрес">
            <input
              name="locationAddress"
              defaultValue={defaults?.locationAddress ?? ""}
              placeholder="Уфа, ул. Ленина 1"
              className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Широта (lat)">
              <input
                name="locationLat"
                type="number"
                step="any"
                defaultValue={defaults?.locationLat ?? undefined}
                placeholder="54.7388"
                className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
              />
            </Field>
            <Field label="Долгота (lng)">
              <input
                name="locationLng"
                type="number"
                step="any"
                defaultValue={defaults?.locationLng ?? undefined}
                placeholder="55.9721"
                className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-ink p-5">
        <legend className="px-2 type-mono-caps">баллы</legend>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isPointsEligible"
              defaultChecked={defaults?.isPointsEligible ?? false}
              className="h-4 w-4 border border-ink"
            />
            <span className="font-sans text-[14px] text-ink">
              Начисляем баллы за участие
            </span>
          </label>
          <Field label="Базовое начисление, баллов">
            <input
              name="basePointsAward"
              type="number"
              min={0}
              defaultValue={defaults?.basePointsAward ?? 0}
              className="h-11 w-32 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
            />
          </Field>
        </div>
      </fieldset>

      {state && !state.ok ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {state.message}
        </p>
      ) : null}

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
      className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
    >
      {pending ? "Сохраняем…" : label}
    </button>
  );
}
