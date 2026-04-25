import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { JOURNAL } from "@/lib/home-mock";

export function Journal() {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">журнал</span>
            <h2 className="type-h2">
              Что{" "}
              <em className="not-italic text-brand-red">пишем</em> между забегами.
            </h2>
          </div>
          <Link
            href="/journal"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Все заметки →
          </Link>
        </div>

        <div className="grid grid-cols-1 border border-ink md:grid-cols-3">
          {JOURNAL.map((post, idx) => (
            <Link
              href={`/journal/${post.id}`}
              key={post.id}
              className={
                "flex flex-col gap-4 p-6 transition-colors hover:bg-paper-2 md:p-8" +
                (idx > 0
                  ? " border-t border-ink md:border-l md:border-t-0"
                  : "")
              }
            >
              <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
                <span className="text-brand-red">{post.eyebrow}</span>
                <span className="text-muted-2">·</span>
                <span className="text-muted">{post.date}</span>
              </div>
              <h3
                className="type-h3 flex-1"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
              <span className="text-[13px] font-medium text-ink">
                Читать →
              </span>
            </Link>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
