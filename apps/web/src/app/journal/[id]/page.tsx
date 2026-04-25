import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { JOURNAL } from "@/lib/home-mock";
import { getSiteState } from "@/lib/site-state";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const post = JOURNAL.find((p) => p.id === params.id);
  return { title: post ? `Журнал · CITYRNNG` : "Журнал · CITYRNNG" };
}

export default async function JournalPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = JOURNAL.find((p) => p.id === params.id);
  if (!post) notFound();

  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <article>
        <header className="border-b border-ink">
          <Wrap className="flex flex-col gap-4 py-12 lg:py-16">
            <Link
              href="/journal"
              className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
            >
              ← Журнал
            </Link>
            <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
              <span className="text-brand-red">{post.eyebrow}</span>
              <span className="text-muted-2">·</span>
              <span className="text-muted">{post.date}</span>
            </div>
            <h1
              className="type-hero"
              style={{ fontSize: 64 }}
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
          </Wrap>
        </header>

        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <div className="prose-cityrnng max-w-[680px] text-[16px] leading-[1.65] text-graphite">
              <p>
                Текст материала готовится. Журнал — отдельный CMS-эпик
                (наполнение через админку придёт во второй итерации). Эта
                страница — оболочка, которая получит контент из{" "}
                <code className="font-mono text-[14px] text-ink">posts</code>{" "}
                таблицы, как только она появится.
              </p>
              <p>
                Пока — лови себя на&nbsp;мысли «это интересно?» и&nbsp;
                <Link
                  href="/auth"
                  className="text-brand-red underline-offset-4 hover:underline"
                >
                  заходи в&nbsp;клуб
                </Link>
                . Анонсы публикуем в&nbsp;Telegram, ссылка в&nbsp;футере.
              </p>
            </div>
          </Wrap>
        </section>
      </article>
    </PageShell>
  );
}
