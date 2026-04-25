"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/site/logout-button";
import { CLUB } from "@/lib/club";

type SidebarSection = {
  href: string;
  label: string;
  /** Mark items not yet implemented so they show as disabled-style. */
  comingSoon?: boolean;
};

const SECTIONS: SidebarSection[] = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/locations", label: "Локации" },
  { href: "/admin/events", label: "События", comingSoon: true },
  { href: "/admin/recurrence", label: "Расписание", comingSoon: true },
  { href: "/admin/partners", label: "Партнёры" },
  { href: "/admin/rewards", label: "Награды" },
  { href: "/admin/attendances", label: "Attendances", comingSoon: true },
  { href: "/admin/users", label: "Пользователи", comingSoon: true },
  { href: "/admin/points", label: "Балльные операции", comingSoon: true },
];

export function AdminSidebar({ isDev }: { isDev: boolean }) {
  const currentPath = usePathname() ?? "/admin";
  return (
    <aside className="flex h-full min-h-screen flex-col border-r border-ink bg-paper-2/40 lg:w-[260px] lg:flex-none">
      <div className="flex flex-col gap-1 border-b border-ink px-6 py-5">
        <Link
          href="/"
          className="font-display text-[20px] font-bold leading-none tracking-[-0.025em] text-ink"
        >
          city<span className="text-brand-red">rnng</span>
        </Link>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          {CLUB.city} · ADMIN
        </span>
        {isDev ? (
          <span className="mt-2 inline-flex h-6 items-center self-start border border-brand-red bg-brand-tint px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-brand-red-ink">
            dev mock session
          </span>
        ) : null}
      </div>

      <nav className="flex flex-col py-4">
        {SECTIONS.map((s) => {
          const isActive =
            s.href === "/admin"
              ? currentPath === "/admin"
              : currentPath === s.href || currentPath.startsWith(`${s.href}/`);
          if (s.comingSoon) {
            return (
              <span
                key={s.href}
                className="flex items-center justify-between px-6 py-2.5 font-sans text-[14px] font-medium text-muted-2"
                title="Скоро"
              >
                {s.label}
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                  скоро
                </span>
              </span>
            );
          }
          return (
            <Link
              key={s.href}
              href={s.href}
              className={
                "px-6 py-2.5 font-sans text-[14px] font-medium transition-colors " +
                (isActive
                  ? "border-l-2 border-brand-red bg-paper text-ink"
                  : "text-graphite hover:bg-paper-2 hover:text-ink")
              }
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-ink px-6 py-4 text-[12px]">
        <Link href="/" className="text-graphite hover:text-brand-red">
          ← На сайт
        </Link>
        {!isDev ? (
          <div className="flex h-10 border border-ink">
            <span className="flex flex-1 items-center px-3 text-[12px] text-muted">
              Сессия активна
            </span>
            <LogoutButton />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
