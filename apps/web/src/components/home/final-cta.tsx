import Link from "next/link";
import { Wrap } from "@/components/site/wrap";

export function FinalCta({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="border-b border-ink bg-ink text-paper">
      <Wrap className="flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-end lg:py-24">
        <h2 className="type-h2 max-w-3xl text-paper">
          {isAuthed ? (
            <>
              Следующая среда через{" "}
              <em className="not-italic text-brand-red">1&nbsp;день</em>. Ждём.
            </>
          ) : (
            <>
              Следующая среда через{" "}
              <em className="not-italic text-brand-red">6&nbsp;дней</em>.
              Добежим?
            </>
          )}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={isAuthed ? "/events/w-22" : "/auth"}
            className="inline-flex h-14 items-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink"
          >
            {isAuthed ? "Маршрут среды →" : "Войти в клуб →"}
          </Link>
          <Link
            href="/about"
            className="inline-flex h-14 items-center border border-paper/40 bg-transparent px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-paper/10"
          >
            О проекте
          </Link>
        </div>
      </Wrap>
    </section>
  );
}
