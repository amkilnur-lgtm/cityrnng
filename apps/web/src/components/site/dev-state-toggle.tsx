"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const COOKIE_NAME = "cityrnng_dev_state";

type DevState = "guest" | "authed" | "admin";

/**
 * Dev-only floating toggle for guest / authed / admin mock states.
 * Backed by a cookie (set via /api/dev/state) so the choice persists
 * across all routes — not just the home page.
 *
 * - guest: no cookie → public site
 * - authed: cookie="authed" → /app, /shop authed views; not admin
 * - admin: cookie="admin" → /admin unlocked + authed everywhere else
 */
export function DevStateToggle() {
  if (process.env.NODE_ENV === "production") return null;
  return <DevStateToggleInner />;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function DevStateToggleInner() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<DevState>("guest");

  useEffect(() => {
    const value = readCookie(COOKIE_NAME);
    if (value === "admin") setCurrent("admin");
    else if (value === "authed") setCurrent("authed");
    else setCurrent("guest");
  }, []);

  function pick(state: DevState) {
    if (pending || current === state) return;
    setCurrent(state);
    startTransition(async () => {
      try {
        await fetch("/api/dev/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        });
        router.refresh();
      } catch {
        // No-op — dev tool, swallow.
      }
    });
  }

  return (
    <div
      aria-label="Dev state toggle"
      className="fixed bottom-4 right-4 z-50 flex border border-ink bg-paper font-mono text-[11px] font-medium uppercase tracking-[0.14em] shadow-[0_0_0_1px_white]"
    >
      {(["guest", "authed", "admin"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => pick(s)}
          disabled={pending}
          className={cn(
            "px-3 py-2 transition-colors",
            current === s
              ? "bg-ink text-paper"
              : "bg-paper text-muted hover:text-ink",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
