"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createScanDeviceAction } from "@/app/admin/checkin/actions";

type LocationOption = { id: string; name: string; city: string };

export function ScanDeviceCreateForm({
  locations,
}: {
  locations: LocationOption[];
}) {
  const [state, formAction] = useFormState(createScanDeviceAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful create — otherwise the button stays
  // enabled with the same values loaded, and a stray second click silently
  // creates a duplicate device with no extra confirmation.
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="type-label">Точка сбора</span>
          <select
            name="locationId"
            required
            defaultValue=""
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
          >
            <option value="" disabled>
              — выбери точку —
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.city}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="type-label">Название сканера</span>
          <input
            name="label"
            required
            placeholder="Малина на Карла Маркса"
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus focus:bg-brand-tint/30"
          />
        </label>
      </div>

      {state?.ok ? (
        <div className="flex flex-col gap-2 border border-brand-red bg-brand-tint/30 p-4">
          <span className="type-mono-caps text-brand-red">
            ключ создан — покажется один раз
          </span>
          <p className="text-[13px] text-graphite">
            Скопируй и&nbsp;пропиши его в&nbsp;конфиг сканера (заголовок{" "}
            <code className="font-mono text-ink">X-Device-Key</code>). Повторно
            не&nbsp;покажем — потеряешь, перевыпусти ключ.
          </p>
          <code className="select-all break-all border border-ink bg-paper px-3 py-2 font-mono text-[13px] text-ink">
            {state.key}
          </code>
        </div>
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

      <SubmitButton disabled={locations.length === 0} />
      {locations.length === 0 ? (
        <p className="text-[12px] text-muted">
          Сначала заведи активную точку в&nbsp;разделе «Локации».
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 disabled:text-graphite"
    >
      {pending ? "Создаём…" : "Создать сканер"}
    </button>
  );
}
