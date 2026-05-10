"use client";

import { useFormState, useFormStatus } from "react-dom";
import { verifyRedemptionAction } from "@/app/admin/redemptions/actions";

type Result = { ok: true; message?: string } | { ok: false; message: string };

export function RedemptionVerifyForm() {
  const [state, formAction] = useFormState<Result | undefined, FormData>(
    verifyRedemptionAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 border border-ink bg-paper p-5 md:p-6"
    >
      <span className="type-mono-caps">погашение кода</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          name="code"
          required
          maxLength={12}
          placeholder="ABC234"
          autoComplete="off"
          spellCheck={false}
          className="h-11 flex-1 border border-ink bg-paper px-3 font-mono text-[16px] uppercase tracking-[0.16em] outline-none c3-focus focus:bg-brand-tint/30"
        />
        <Submit />
      </div>
      {state?.ok ? (
        <p className="font-mono text-[12px] tracking-[0.04em] text-brand-red">
          ✓ {state.message ?? "Код погашен."}
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
      className="inline-flex h-11 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:opacity-60"
    >
      {pending ? "Гасим…" : "Погасить →"}
    </button>
  );
}
