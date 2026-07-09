"use client";

import { useRef, useState } from "react";
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
  distanceLabel?: string | null;
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
  /** Ids of CityLocations whose participants are at THIS event instead of
   *  the regular Wednesday at their usual point. Seeds checkbox state. */
  excludesRegularLocationIds?: string[];
};

/** Add `+2h` to a YYYY-MM-DDTHH:MM string. Returns the same format. */
function plusTwoHoursLocal(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  d.setHours(d.getHours() + 2);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Subset of AdminLocation we actually use for the picker — keep the
 *  prop type narrow so callers don't have to import the full admin DTO. */
export type LocationOption = {
  id: string;
  name: string;
  city: string;
  venue: string | null;
  address: string | null;
  lat: number;
  lng: number;
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
  locations = [],
  defaultLocationIds = [],
}: {
  action: Action;
  defaults?: Defaults;
  submitLabel: string;
  /** All active CityLocations — rendered as checkboxes; checked ones get
   *  attached to the event's sync-rule on save (enabling RSVP). */
  locations?: LocationOption[];
  /** IDs of CityLocations already attached to this event's sync-rule.
   *  Used to seed checkbox state in edit mode. */
  defaultLocationIds?: string[];
}) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  // Controlled location fields — driven either by direct edit or by the
  // multi-select picker. Defaults seed from the edit-mode payload.
  const [locName, setLocName] = useState(defaults?.locationName ?? "");
  const [locAddress, setLocAddress] = useState(defaults?.locationAddress ?? "");
  const [locLat, setLocLat] = useState(
    defaults?.locationLat != null ? String(defaults.locationLat) : "",
  );
  const [locLng, setLocLng] = useState(
    defaults?.locationLng != null ? String(defaults.locationLng) : "",
  );
  // Checked CityLocation ids — drive both the sync-rule attach and the
  // display-field auto-fill (taken from the first checked entry).
  const [checkedLocIds, setCheckedLocIds] = useState<Set<string>>(
    () => new Set(defaultLocationIds),
  );
  // Checked CityLocation ids whose runners are at this event instead of
  // the regular Wednesday occurrence. Independent of the start-point picker
  // above — same catalog, different semantic.
  const [excludedRegularIds, setExcludedRegularIds] = useState<Set<string>>(
    () => new Set(defaults?.excludesRegularLocationIds ?? []),
  );

  function toggleExcludedRegular(id: string, checked: boolean) {
    setExcludedRegularIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleLocation(id: string, checked: boolean) {
    setCheckedLocIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      // Auto-fill display fields from the first checked location (in the
      // catalog's original order). Always overwrites — admin can edit
      // afterwards. Matches the previous single-select behavior.
      const firstId = locations.find((l) => next.has(l.id))?.id;
      const first = firstId ? locations.find((l) => l.id === firstId) : null;
      if (first) fillFromLocation(first);
      return next;
    });
  }

  // Controlled time fields so we can autofill endsAt as startsAt + 2h whenever
  // endsAt is still in lock-step (or empty). Once admin types something into
  // endsAt manually, we stop tracking.
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(defaults?.startsAt));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(defaults?.endsAt));
  const lastAutoEndsRef = useRef<string>(toDatetimeLocal(defaults?.endsAt));

  function fillFromLocation(loc: LocationOption | undefined) {
    if (!loc) return;
    // Prefer the partner-venue name (e.g. "Monkey Grinder") over the
    // generic location name ("Центр"). Fallback to the location name
    // when no venue is configured.
    setLocName(loc.venue ?? loc.name);
    // Address: street if we have one, else fall back to the city. The
    // event-detail UI concatenates city separately if needed.
    setLocAddress(
      loc.address ? `${loc.city}, ${loc.address}` : loc.city,
    );
    setLocLat(String(loc.lat));
    setLocLng(String(loc.lng));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Название">
        <input
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder="Утренний забег с пейсером"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>
      {/* Slug is auto-generated server-side from the title (with collision
          suffixes). When editing, we still ship the existing slug so the API
          doesn't try to derive a new one and fail uniqueness. */}
      <input type="hidden" name="slug" defaultValue={defaults?.slug ?? ""} />

      <Field label="Описание" hint="опционально">
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults?.description ?? ""}
          placeholder="5 км в комфортном темпе с пейсером 6:00/км. Сбор у Monkey Grinder."
          className="border border-ink bg-paper px-3 py-2 font-sans text-[14px] leading-[1.55] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>

      <Field
        label="Дистанции (текстом)"
        hint="«10 км», «3+7», «без дистанции — 60 мин», пусто = посчитать из локаций"
      >
        <input
          name="distanceLabel"
          defaultValue={defaults?.distanceLabel ?? ""}
          placeholder="10 км"
          className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Тип">
          <select
            name="type"
            defaultValue={defaults?.type ?? "special"}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
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
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
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
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
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
              value={startsAt}
              onChange={(ev) => {
                const v = ev.target.value;
                setStartsAt(v);
                // Roll endsAt forward to startsAt + 2h as long as admin
                // hasn't manually overridden it. We detect override by
                // comparing the current endsAt to the last auto-filled
                // value: if they match, endsAt is still in lock-step.
                if (v && (!endsAt || endsAt === lastAutoEndsRef.current)) {
                  const next = plusTwoHoursLocal(v);
                  setEndsAt(next);
                  lastAutoEndsRef.current = next;
                }
              }}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Окончание" hint="по умолчанию старт + 2ч">
            <input
              name="endsAt"
              type="datetime-local"
              required
              value={endsAt}
              onChange={(ev) => setEndsAt(ev.target.value)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Регистрация открыта с" hint="опционально">
            <input
              name="registrationOpenAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaults?.registrationOpenAt)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Регистрация закрывается" hint="опционально">
            <input
              name="registrationCloseAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaults?.registrationCloseAt)}
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="border border-ink p-5">
        <legend className="px-2 type-mono-caps">где</legend>
        <div className="flex flex-col gap-5">
          {locations.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="type-label flex items-center justify-between">
                Точки старта
                <span className="font-mono text-[11px] font-normal text-muted">
                  нужны для кнопки «Я иду»
                </span>
              </span>
              <ul className="flex flex-col border border-ink bg-paper">
                {locations.map((l, idx) => {
                  const checked = checkedLocIds.has(l.id);
                  return (
                    <li
                      key={l.id}
                      className={
                        "flex items-center gap-3 px-3 py-2.5 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <input
                        type="checkbox"
                        name="locationIds"
                        value={l.id}
                        checked={checked}
                        onChange={(ev) => toggleLocation(l.id, ev.target.checked)}
                        className="h-4 w-4 border border-ink"
                      />
                      <span className="flex-1 font-sans text-[14px] text-ink">
                        {l.name}
                        {l.venue ? (
                          <span className="text-muted"> · {l.venue}</span>
                        ) : null}
                        <span className="text-muted"> · {l.city}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="font-mono text-[11px] text-muted">
                Нет нужной точки? Создай в&nbsp;
                <a
                  href="/admin/locations"
                  className="text-brand-red hover:underline"
                >
                  /admin/locations
                </a>
                .
              </p>
            </div>
          ) : null}

          <hr className="border-ink/20" />

          <p className="type-label">
            Витрина{" "}
            <span className="ml-2 font-mono text-[11px] font-normal text-muted">
              текст под названием на странице события
            </span>
          </p>
          <Field label="Название места" hint="«Парк Якутова»">
            <input
              name="locationName"
              value={locName}
              onChange={(ev) => setLocName(ev.target.value)}
              className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
          <Field label="Адрес">
            <input
              name="locationAddress"
              value={locAddress}
              onChange={(ev) => setLocAddress(ev.target.value)}
              placeholder="Уфа, ул. Ленина 1"
              className="h-11 border border-ink bg-paper px-3 font-sans text-[15px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Широта (lat)">
              <input
                name="locationLat"
                type="number"
                step="any"
                value={locLat}
                onChange={(ev) => setLocLat(ev.target.value)}
                placeholder="54.7388"
                className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
              />
            </Field>
            <Field label="Долгота (lng)">
              <input
                name="locationLng"
                type="number"
                step="any"
                value={locLng}
                onChange={(ev) => setLocLng(ev.target.value)}
                placeholder="55.9721"
                className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
              />
            </Field>
          </div>
        </div>
      </fieldset>

      {locations.length > 0 ? (
        <fieldset className="border border-ink p-5">
          <legend className="px-2 type-mono-caps">
            забираем с регулярной среды
          </legend>
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-graphite">
              Отметь точки, чьи участники в&nbsp;этот день идут на&nbsp;это
              событие вместо обычной пробежки. Из&nbsp;регулярного Ситираннинга
              эти точки уйдут только на&nbsp;дату события.
            </p>
            <ul className="flex flex-col border border-ink bg-paper">
              {locations.map((l, idx) => {
                const checked = excludedRegularIds.has(l.id);
                return (
                  <li
                    key={l.id}
                    className={
                      "flex items-center gap-3 px-3 py-2.5 " +
                      (idx > 0 ? "border-t border-ink/15" : "")
                    }
                  >
                    <input
                      type="checkbox"
                      name="excludesRegularLocationIds"
                      value={l.id}
                      checked={checked}
                      onChange={(ev) =>
                        toggleExcludedRegular(l.id, ev.target.checked)
                      }
                      className="h-4 w-4 border border-ink"
                    />
                    <span className="flex-1 font-sans text-[14px] text-ink">
                      {l.name}
                      {l.venue ? (
                        <span className="text-muted"> · {l.venue}</span>
                      ) : null}
                      <span className="text-muted"> · {l.city}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </fieldset>
      ) : null}

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
              className="h-11 w-32 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
            />
          </Field>
        </div>
      </fieldset>

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
      className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 disabled:text-graphite"
    >
      {pending ? "Сохраняем…" : label}
    </button>
  );
}
