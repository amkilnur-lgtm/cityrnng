"use client";

import { useFormStatus } from "react-dom";

export function RedeemButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Обмениваю…" : "Обменять →"}
    </button>
  );
}
