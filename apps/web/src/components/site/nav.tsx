import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/site/logout-button";
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
  // Authed users get a 2-row layout on mobile so the full pill (avatar +
  // name + points + logout) doesn't crowd the wordmark out. Desktop stays
  // single-row regardless.
  const stacked = state.isAuthed;
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "sticky top-0 z-10 border-b border-ink bg-paper",
        stacked
          ? "flex flex-col md:h-[70px] md:flex-row md:items-center md:justify-between md:gap-6 md:px-12"
          : "flex h-[70px] items-center justify-between gap-6 px-6 lg:px-12",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          stacked
            ? "h-[70px] justify-between gap-6 border-b border-ink px-6 md:h-auto md:flex-1 md:justify-start md:gap-8 md:border-b-0 md:px-0"
            : "shrink-0 gap-6",
        )}
      >
        <Link
          href="/"
          aria-label={CLUB.name}
          className="flex shrink-0 items-center gap-3 no-underline"
        >
          <Image
            src="/brand/wordmark-text.png"
            alt={CLUB.name}
            width={170}
            height={30}
            priority
            style={{ height: 30, width: "auto" }}
          />
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

        {stacked && <MenuButton />}
      </div>

      <div
        className={cn(
          "flex items-center gap-2",
          stacked && "h-[70px] justify-end px-6 md:h-auto md:px-0",
        )}
      >
        {!stacked && <MenuButton />}

        {state.isAuthed ? (
          <>
            {state.isAdmin && <AdminPill />}
            <AuthedPill user={state.user} />
          </>
        ) : (
          <GuestCta />
        )}
      </div>
    </nav>
  );
}

function MenuButton() {
  return (
    <button
      type="button"
      aria-label="Меню"
      className="flex h-11 w-11 items-center justify-center border border-ink bg-paper hover:bg-ink hover:text-paper md:hidden"
    >
      <span className="block h-px w-4 bg-current shadow-[0_-5px_0_currentColor,0_5px_0_currentColor]" />
    </button>
  );
}

function AdminPill() {
  return (
    <Link
      href="/admin"
      className="hidden h-11 items-center border border-ink bg-ink px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-paper hover:text-ink md:inline-flex"
    >
      Админ
    </Link>
  );
}

function GuestCta() {
  return (
    <Link
      href="/auth"
      className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
    >
      Войти
    </Link>
  );
}

function AuthedPill({ user }: { user: { name: string; initial: string; points: number } }) {
  return (
    <div className="flex h-11 items-center border border-ink text-ink">
      <Link
        href="/app"
        aria-label="Мой профиль"
        className="flex h-full items-center hover:bg-paper-2"
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
      <LogoutButton />
    </div>
  );
}
