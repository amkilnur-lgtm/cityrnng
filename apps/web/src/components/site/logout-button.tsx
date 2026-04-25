"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="Выйти"
      title="Выйти"
      className="flex h-full items-center border-l border-ink px-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:bg-ink hover:text-paper disabled:opacity-50"
    >
      {busy ? "…" : "Выйти"}
    </button>
  );
}
