import Link from "next/link";
import { CLUB } from "@/lib/club";
import type { SiteState } from "@/lib/home-mock";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Главная", current: true },
  { href: "/events", label: "События" },
  { href: "/shop", label: "Магазин" },
  { href: "/journal", label: "Журнал" },
  { href: "/partners", label: "Партнёрам" },
];

export function SiteNav({ state }: { state: SiteState }) {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-10 flex h-[70px] items-center justify-between gap-6 border-b border-ink bg-paper px-6 lg:px-12"
    >
      <Link
        href="/"
        aria-label="CITYRNNG"
        className="flex items-baseline gap-1.5 no-underline"
      >
        <span className="font-display text-[22px] font-bold leading-none tracking-[-0.025em] text-ink">
          city<span className="text-brand-red">rnng</span>
        </span>
        <span className="hidden font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted md:inline">
          {CLUB.city}
        </span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.current ? "page" : undefined}
            className={cn(
              "font-sans text-[14px] font-medium text-ink transition-colors hover:text-brand-red",
              link.current && "text-brand-red",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Меню"
          className="flex h-10 w-10 items-center justify-center border border-ink bg-paper hover:bg-ink hover:text-paper md:hidden"
        >
          <span className="block h-px w-4 bg-current shadow-[0_-5px_0_currentColor,0_5px_0_currentColor]" />
        </button>

        {state.isAuthed ? <AuthedPill user={state.user} /> : <GuestCta />}
      </div>
    </nav>
  );
}

function GuestCta() {
  return (
    <Link
      href="/auth"
      className="inline-flex h-8 items-center border border-ink bg-paper px-3.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
    >
      Войти
    </Link>
  );
}

function AuthedPill({ user }: { user: { name: string; initial: string; points: number } }) {
  return (
    <Link
      href="/app"
      aria-label="Мой профиль"
      className="flex h-11 items-center border border-ink text-ink hover:bg-paper-2"
    >
      <span className="flex h-11 w-11 items-center justify-center bg-ink font-display text-[16px] font-bold leading-none tracking-tight text-paper">
        {user.initial}
      </span>
      <span className="flex h-full items-center border-l border-ink px-3.5 font-sans text-[14px] font-semibold">
        {user.name}
      </span>
      <span className="flex h-full items-center gap-1.5 border-l border-ink px-3.5 font-mono text-[13px] font-medium tracking-[0.04em] text-brand-red">
        {user.points}&nbsp;Б
      </span>
    </Link>
  );
}
