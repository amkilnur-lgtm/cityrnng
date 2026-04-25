import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { JOURNAL } from "@/lib/home-mock";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Журнал · CITYRNNG" };

export default async function JournalPage() {
  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="журнал"
        title={
          <>
            Что{" "}
            <em className="not-italic text-brand-red">пишем</em> между забегами.
          </>
        }
        lede="Анонсы сред, истории соседей, новости партнёров. Раз в неделю — новый материал."
      />

      <section className="border-b border-ink">
        <Wrap className="py-12 lg:py-16">
          <ul className="flex flex-col border border-ink">
            {JOURNAL.map((post, idx) => (
              <li
                key={post.id}
                className={idx > 0 ? "border-t border-ink/15" : undefined}
              >
                <Link
                  href={`/journal/${post.id}`}
                  className="grid grid-cols-1 gap-3 p-6 transition-colors hover:bg-paper-2 md:grid-cols-[120px_1fr_auto] md:items-center md:gap-8 md:p-8"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red">
                      {post.eyebrow}
                    </span>
                    <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
                      {post.date}
                    </span>
                  </div>
                  <h3
                    className="type-h3"
                    dangerouslySetInnerHTML={{ __html: post.title }}
                  />
                  <span className="font-sans text-[14px] font-medium text-ink md:justify-self-end">
                    Читать →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      </section>
    </PageShell>
  );
}
