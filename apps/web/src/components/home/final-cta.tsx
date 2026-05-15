import Link from "next/link";
import { Wrap } from "@/components/site/wrap";

export function FinalCta({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="border-b border-ink bg-ink text-paper">
      <Wrap className="flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-end lg:py-24">
        <h2 className="type-h2 max-w-3xl text-paper">
          {isAuthed ? (
            <>
              Среда — это{" "}
              <em className="not-italic text-brand-red">просто</em>. Ждём.
            </>
          ) : (
            <>
              Не нужно быть{" "}
              <em className="not-italic text-brand-red">готовым</em>.
              Достаточно прийти.
            </>
          )}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={isAuthed ? "/events" : "/auth"}
            className="inline-flex h-14 items-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink"
          >
            {isAuthed ? "Все маршруты →" : "Присоединиться →"}
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
