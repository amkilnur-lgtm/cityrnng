"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/site/logout-button";
import { CLUB } from "@/lib/club";
import type { SiteState } from "@/lib/home-mock";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/events", label: "События" },
  { href: "/how-it-works", label: "Как это работает" },
  { href: "/shop", label: "Магазин" },
  { href: "/journal", label: "Журнал" },
];

/** Authed users get «Кабинет» first — /app must be reachable from any page,
 *  not only via the (non-obvious) avatar pill. */
function linksFor(isAuthed: boolean) {
  return isAuthed ? [{ href: "/app", label: "Кабинет" }, ...NAV_LINKS] : NAV_LINKS;
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ state }: { state: SiteState }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Single 70px row everywhere. On mobile the authed pill collapses to
  // avatar + points (name lives in the initial, logout moves to the burger
  // drawer) so the wordmark and the pill share one row without crowding.
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-20 flex h-[70px] items-center justify-between gap-3 border-b border-ink bg-paper px-4 sm:gap-6 sm:px-6 lg:px-12"
    >
      <div className="flex min-w-0 shrink items-center gap-6">
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
            className="h-[24px] w-auto sm:h-[30px]"
          />
          <span className="hidden font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted md:inline">
            {CLUB.city}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {linksFor(state.isAuthed).map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-sans text-[14px] font-medium text-ink transition-colors hover:text-brand-red",
                  active && "text-brand-red",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {state.isAuthed ? (
          <>
            {state.isPartner && <PartnerPill />}
            {state.isAdmin && <AdminPill />}
            <AuthedPill user={state.user} />
          </>
        ) : (
          <GuestCta />
        )}
        <MenuButton
          open={menuOpen}
          onToggle={() => setMenuOpen((v) => !v)}
        />
      </div>

      {menuOpen && (
        <MobileDrawer
          pathname={pathname}
          state={state}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}

function MenuButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={open}
      onClick={onToggle}
      className="flex h-11 w-11 items-center justify-center border border-ink bg-paper hover:bg-ink hover:text-paper md:hidden"
    >
      {open ? (
        <span className="block h-5 w-5 relative before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-current before:-translate-y-1/2 before:rotate-45 after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-current after:-translate-y-1/2 after:-rotate-45" />
      ) : (
        <span className="block h-px w-4 bg-current shadow-[0_-5px_0_currentColor,0_5px_0_currentColor]" />
      )}
    </button>
  );
}

function MobileDrawer({
  pathname,
  state,
  onClose,
}: {
  pathname: string | null;
  state: SiteState;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-full border-t border-ink bg-paper md:hidden">
      <ul className="flex flex-col">
        {linksFor(state.isAuthed).map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href} className="border-b border-ink/15">
              <Link
                href={link.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block px-6 py-4 font-sans text-[15px] font-semibold text-ink",
                  active && "text-brand-red",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
        {state.isAuthed && state.isPartner && (
          <li className="border-b border-ink/15">
            <Link
              href="/partner"
              onClick={onClose}
              className="block px-6 py-4 font-sans text-[15px] font-semibold text-ink"
            >
              Кабинет партнёра
            </Link>
          </li>
        )}
        {state.isAuthed && state.isAdmin && (
          <li className="border-b border-ink/15">
            <Link
              href="/admin"
              onClick={onClose}
              className="block px-6 py-4 font-sans text-[15px] font-semibold text-ink"
            >
              Админ
            </Link>
          </li>
        )}
        {state.isAuthed && (
          <li className="border-b border-ink/15 md:hidden">
            <span className="[&>button]:block [&>button]:w-full [&>button]:border-0 [&>button]:px-6 [&>button]:py-4 [&>button]:text-left [&>button]:font-sans [&>button]:text-[15px] [&>button]:font-semibold [&>button]:normal-case [&>button]:tracking-normal [&>button]:text-ink">
              <LogoutButton />
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

function PartnerPill() {
  return (
    <Link
      href="/partner"
      className="hidden h-11 items-center border border-ink bg-paper px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-paper md:inline-flex"
    >
      Партнёр
    </Link>
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
        {/* Name is redundant next to the initial on a narrow screen. */}
        <span className="hidden h-full items-center border-l border-ink px-3.5 font-sans text-[14px] font-semibold md:flex">
          {user.name}
        </span>
        <span className="flex h-full items-center gap-1.5 border-l border-ink px-3 font-mono text-[13px] font-medium tracking-[0.04em] text-brand-red sm:px-3.5">
          {user.points}&nbsp;Б
        </span>
      </Link>
      {/* On mobile logout lives in the burger drawer. */}
      <span className="hidden h-full md:flex">
        <LogoutButton />
      </span>
    </div>
  );
}
