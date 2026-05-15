import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Партнёрам · CITYRNNG" };

const CURRENT_PARTNERS = [
  {
    name: "Monkey Grinder",
    locations: "Карла Маркса 41, Проспект Октября 63А",
    role: "Старт + кофе после двух из трёх пробежек",
  },
  {
    name: "Surf Coffee",
    locations: "Первомайская 22",
    role: "Старт + кофе после черниковской пробежки",
  },
];

export default async function PartnersPage() {
  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="партнёрам"
        title={
          <>
            Не&nbsp;только в&nbsp;
            <em className="not-italic text-brand-red">Уфе</em>.
          </>
        }
        lede="Сити Раннинг растёт — мы ищем партнёров по всему миру. Если у тебя кофейня, пекарня, спортивный магазин или другой проект, рядом с которым может стартовать или финишировать пробежка — расскажи о себе."
      />

      <section className="border-b border-ink">
        <Wrap className="py-12 lg:py-16">
          <div className="mb-6 flex flex-col gap-2">
            <span className="type-mono-caps">сейчас с нами</span>
            <h2 className="type-h2">
              {CURRENT_PARTNERS.length}{" "}
              <em className="not-italic text-brand-red">кофейни</em>{" "}
              на&nbsp;старте.
            </h2>
          </div>
          <ul className="flex flex-col border border-ink">
            {CURRENT_PARTNERS.map((p, idx) => (
              <li
                key={p.name}
                className={
                  "grid grid-cols-1 gap-3 p-6 md:grid-cols-[280px_1fr_auto] md:items-center md:gap-8 md:p-8" +
                  (idx > 0 ? " border-t border-ink/15" : "")
                }
              >
                <h3 className="font-display text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[28px]">
                  {p.name}
                </h3>
                <p className="text-[14px] text-graphite">{p.role}</p>
                <span className="font-mono text-[12px] tracking-[0.04em] text-muted md:justify-self-end">
                  {p.locations}
                </span>
              </li>
            ))}
          </ul>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col gap-4">
            <span className="type-mono-caps">как это устроено</span>
            <h2 className="type-h2">
              Бегуны приходят к&nbsp;тебе на&nbsp;
              <em className="not-italic text-brand-red">кофе</em> после
              пробежки.
            </h2>
            <p className="text-[15px] leading-[1.55] text-graphite">
              Каждую среду до&nbsp;25 человек добегают до&nbsp;парка
              в&nbsp;разных районах {CLUB.cityGenitive}. После пробежки
              им&nbsp;нужно где-то согреться, выпить кофе, съесть выпечку.
              Это&nbsp;ты.
            </p>
            <p className="text-[15px] leading-[1.55] text-graphite">
              Мы&nbsp;даём им&nbsp;баллы за&nbsp;участие. Они тратят баллы
              у&nbsp;тебя — показывают QR, ты&nbsp;сканируешь, отдаёшь
              позицию. Расчёт по&nbsp;факту в&nbsp;конце месяца.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <span className="type-mono-caps">что нужно от тебя</span>
            <ul className="flex flex-col gap-3 text-[15px] leading-[1.5] text-graphite">
              <li className="flex gap-3 border-b border-ink/15 pb-3">
                <span className="font-mono text-brand-red">01</span>
                <span>
                  1-3 позиции в&nbsp;каталоге (кофе / выпечка /
                  спецпредложение)
                </span>
              </li>
              <li className="flex gap-3 border-b border-ink/15 pb-3">
                <span className="font-mono text-brand-red">02</span>
                <span>Цена в&nbsp;баллах (поможем посчитать)</span>
              </li>
              <li className="flex gap-3 border-b border-ink/15 pb-3">
                <span className="font-mono text-brand-red">03</span>
                <span>
                  Сотрудник, который умеет сканировать QR (телефон
                  с&nbsp;камерой)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-brand-red">04</span>
                <span>
                  Несколько фото места и&nbsp;меню для карточки
                </span>
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
              Напиши{" "}
              <em className="not-italic text-brand-red">в&nbsp;Telegram</em>{" "}
              или на&nbsp;email.
            </h2>
            <p className="text-[15px] text-graphite">
              Расскажем условия, покажем кейсы Monkey Grinder и&nbsp;Surf
              Coffee. Подключение — бесплатно.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${CLUB.contacts.partnersEmail}`}
              className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
            >
              {CLUB.contacts.partnersEmail} →
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
