"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Dev-only floating toggle for guest / authed state. Mirrors the
 * prototype's bottom-right switcher. Replace with real session state
 * once Epic 1 auth UI is wired.
 */
export function DevStateToggle() {
  if (process.env.NODE_ENV === "production") return null;
  return <DevStateToggleInner />;
}

function DevStateToggleInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.get("state") === "authed" ? "authed" : "guest";

  const hrefFor = (state: "guest" | "authed") => {
    const params = new URLSearchParams(search.toString());
    if (state === "authed") params.set("state", "authed");
    else params.delete("state");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div
      aria-label="Dev state toggle"
      className="fixed bottom-4 right-4 z-50 flex border border-ink bg-paper font-mono text-[11px] font-medium uppercase tracking-[0.14em] shadow-[0_0_0_1px_white]"
    >
      {(["guest", "authed"] as const).map((s) => (
        <Link
          key={s}
          href={hrefFor(s)}
          scroll={false}
          className={cn(
            "px-3 py-2 transition-colors",
            current === s
              ? "bg-ink text-paper"
              : "bg-paper text-muted hover:text-ink",
          )}
        >
          {s}
        </Link>
      ))}
    </div>
  );
}
