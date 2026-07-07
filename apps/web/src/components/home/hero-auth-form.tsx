import Link from "next/link";

/**
 * Homepage hero entry point. One button → /auth, where the full form (name,
 * email, password) lives. Keeps the hero to a single clear call-to-action.
 */
export function HeroAuthForm() {
  return (
    <div className="mt-10 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/auth?tab=register"
          className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink"
        >
          Присоединиться →
        </Link>
        <Link
          href="/auth"
          className="inline-flex h-14 items-center justify-center border border-ink bg-paper px-6 font-sans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Уже с нами? Войти
        </Link>
      </div>
      <p className="text-[13px] text-muted">
        Имя, почта, пароль — минута, и&nbsp;ты&nbsp;в&nbsp;клубе.
      </p>
    </div>
  );
}
