"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLUB } from "@/lib/club";

type Section = { href: string; label: string };

const SECTIONS: Section[] = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/locations", label: "Локации" },
  { href: "/admin/recurrence", label: "Расписание" },
  { href: "/admin/events", label: "События" },
  { href: "/admin/attendances", label: "Посещения" },
  { href: "/admin/partners", label: "Партнёры" },
  { href: "/admin/rewards", label: "Награды" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/points", label: "Баллы" },
  { href: "/admin/strava", label: "Strava" },
];

export function AdminTopBar({ isDev }: { isDev: boolean }) {
  const currentPath = usePathname() ?? "/admin";
  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-ink bg-paper lg:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink/15 px-5 py-3">
        <Link
          href="/"
          className="font-display text-[18px] font-bold leading-none tracking-[-0.025em] text-ink"
        >
          city<span className="text-brand-red">rnng</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {CLUB.city} · ADMIN
          </span>
          {isDev ? (
            <span className="inline-flex h-5 items-center border border-brand-red bg-brand-tint px-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-brand-red-ink">
              dev
            </span>
          ) : null}
        </div>
      </div>

      <nav className="flex overflow-x-auto" aria-label="Разделы админки">
        <ul className="flex min-w-full">
          {SECTIONS.map((s) => {
            const isActive =
              s.href === "/admin"
                ? currentPath === "/admin"
                : currentPath === s.href || currentPath.startsWith(`${s.href}/`);
            return (
              <li key={s.href} className="flex-none">
                <Link
                  href={s.href}
                  className={
                    "flex items-center whitespace-nowrap border-b-2 px-4 py-3 font-sans text-[13px] font-medium transition-colors " +
                    (isActive
                      ? "border-brand-red text-ink"
                      : "border-transparent text-graphite hover:text-ink")
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
