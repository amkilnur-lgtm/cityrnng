import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Партнёрам · CITYRNNG" };

export default async function PartnersPage() {
  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="партнёрам"
        title={
          <>
            Кофейни, пекарни, локальные{" "}
            <em className="not-italic text-brand-red">бренды</em>.
          </>
        }
        lede="Каталог партнёров и rewards-flow в разработке (Epic 5). Если хочешь подключиться к клубу — напиши."
      />

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col gap-4">
            <span className="type-mono-caps">как это устроено</span>
            <h2 className="type-h2">
              Соседи бегут к&nbsp;тебе на&nbsp;
              <em className="not-italic text-brand-red">кофе</em> после старта.
            </h2>
            <p className="text-[15px] leading-[1.55] text-graphite">
              Каждую среду ~15 человек добегают до&nbsp;парка
              в&nbsp;твоём районе. После пробежки им&nbsp;нужно где-то
              согреться, выпить кофе, съесть круассан. Это&nbsp;ты.
            </p>
            <p className="text-[15px] leading-[1.55] text-graphite">
              Мы&nbsp;даём им&nbsp;баллы за&nbsp;пробежки. Они тратят баллы
              у&nbsp;тебя — показывают QR, ты&nbsp;сканируешь, отдаёшь
              позицию. Расчёт по&nbsp;факту в&nbsp;конце месяца.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <span className="type-mono-caps">что нужно от тебя</span>
            <ul className="flex flex-col gap-3 text-[15px] leading-[1.5] text-graphite">
              <li className="flex gap-3 border-b border-ink/15 pb-3">
                <span className="font-mono text-brand-red">01</span>
                <span>1-3 позиции в&nbsp;каталоге (кофе / круассан / абонемент)</span>
              </li>
              <li className="flex gap-3 border-b border-ink/15 pb-3">
                <span className="font-mono text-brand-red">02</span>
                <span>Цена в&nbsp;баллах (мы&nbsp;поможем посчитать)</span>
              </li>
              <li className="flex gap-3 border-b border-ink/15 pb-3">
                <span className="font-mono text-brand-red">03</span>
                <span>Сотрудник, который умеет сканировать QR (телефон с&nbsp;камерой)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-brand-red">04</span>
                <span>Несколько фото места и&nbsp;меню для карточки</span>
              </li>
            </ul>
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink bg-paper-2/60">
        <Wrap className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <span className="type-mono-caps">подключиться</span>
            <h2 className="type-h2">
              Напиши <em className="not-italic text-brand-red">в&nbsp;Telegram</em>{" "}
              или на&nbsp;email.
            </h2>
            <p className="text-[15px] text-graphite">
              Расскажем условия, покажем кейсы, ответим на&nbsp;вопросы.
              Подключение к&nbsp;клубу — бесплатно.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:partners@cityrnng.ru"
              className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
            >
              partners@cityrnng.ru →
            </a>
            <Link
              href="/about"
              className="inline-flex h-12 items-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              О проекте
            </Link>
          </div>
        </Wrap>
      </section>
    </PageShell>
  );
}
