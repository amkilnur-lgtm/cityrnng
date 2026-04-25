"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { AdminLocation } from "@/lib/api-admin";

type ActionResult = { ok: true } | { ok: false; message: string };
type Action = (
  prev: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

type Defaults = {
  title?: string;
  type?: "regular" | "special" | "partner";
  status?: "active" | "paused";
  dayOfWeek?: number;
  timeOfDay?: string;
  durationMinutes?: number;
  isPointsEligible?: boolean;
  basePointsAward?: number;
  startsFromDate?: string | null;
  endsAtDate?: string | null;
  selectedLocationIds?: string[];
};

const DAYS = [
  { v: 0, label: "Воскресенье" },
  { v: 1, label: "Понедельник" },
  { v: 2, label: "Вторник" },
  { v: 3, label: "Среда" },
  { v: 4, label: "Четверг" },
  { v: 5, label: "Пятница" },
  { v: 6, label: "Суббота" },
];

function fmtDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export function RecurrenceForm({
  action,
  defaults,
  submitLabel,
  locations,
}: {
  action: Action;
  defaults?: Defaults;
  submitLabel: string;
  locations: AdminLocation[];
}) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );
  const selected = new Set(defaults?.selectedLocationIds ?? []);

  if (locations.length === 0) {
    return (
      <div className="flex flex-col gap-3 border border-ink bg-paper-2 p-6">
        <span className="type-mono-caps">локаций нет</span>
        <p className="text-[14px] leading-[1.55] text-graphite">
          Сначала создай хотя бы одну активную локацию — без неё правило
          не работает.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Название">
        <input
          name="title"
          required
          defaultValue={defaults?.title ?? "Регулярная среда — Ситираннинг"}
          className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none focus:bg-brand-tint/30"
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Тип">
          <select
            name="type"
            defaultValue={defaults?.type ?? "regular"}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px]"
          >
            <option value="regular">regular</option>
            <option value="special">special</option>
            <option value="partner">partner</option>
          </select>
        </Field>
        <Field label="Статус">
          <select
            name="status"
            defaultValue={defaults?.status ?? "active"}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px]"
          >
            <option value="active">active</option>
            <option value="paused">paused</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="День недели">
          <select
            name="dayOfWeek"
            defaultValue={defaults?.dayOfWeek ?? 3}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px]"
          >
            {DAYS.map((d) => (
              <option key={d.v} value={d.v}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Время" hint="HH:MM, локальная TZ сервера">
          <input
            name="timeOfDay"
            required
            defaultValue={defaults?.timeOfDay ?? "19:30"}
            placeholder="19:30"
            pattern="^([01]?\d|2[0-3]):([0-5]\d)$"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Длительность, мин">
          <input
            name="durationMinutes"
            type="number"
            min={15}
            max={720}
            defaultValue={defaults?.durationMinutes ?? 90}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Действует с">
          <input
            name="startsFromDate"
            type="date"
            required
            defaultValue={fmtDate(defaults?.startsFromDate)}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
        <Field label="Действует до" hint="опционально, sunset">
          <input
            name="endsAtDate"
            type="date"
            defaultValue={fmtDate(defaults?.endsAtDate)}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Баллы за участие">
          <input
            name="basePointsAward"
            type="number"
            min={0}
            defaultValue={defaults?.basePointsAward ?? 30}
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none focus:bg-brand-tint/30"
          />
        </Field>
        <Field label=" ">
          <label className="flex h-11 items-center gap-3 border border-ink bg-paper px-3 text-[14px]">
            <input
              type="checkbox"
              name="isPointsEligible"
              defaultChecked={defaults?.isPointsEligible ?? true}
              className="h-4 w-4 accent-brand-red"
            />
            Начислять баллы участникам
          </label>
        </Field>
      </div>
      <Field label="Локации (точки старта)" hint="мин. одна">
        <div className="flex flex-col gap-2 border border-ink bg-paper p-3">
          {locations.map((loc) => (
            <label
              key={loc.id}
              className="flex items-center gap-3 text-[14px]"
            >
              <input
                type="checkbox"
                name="locationIds"
                value={loc.id}
                defaultChecked={selected.has(loc.id)}
                className="h-4 w-4 accent-brand-red"
              />
              <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
                {loc.slug}
              </span>
              <span>{loc.name}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-2">
                {loc.city}
              </span>
            </label>
          ))}
        </div>
      </Field>

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
