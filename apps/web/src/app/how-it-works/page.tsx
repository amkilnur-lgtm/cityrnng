import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Как это работает · CITYRNNG" };

const STEPS = [
  {
    n: "01",
    title: "Регистрируешься один раз",
    body: (
      <>
        Имя, почта, пароль — минута, и&nbsp;ты&nbsp;в&nbsp;клубе.
        На&nbsp;счёт сразу падает{" "}
        <b className="font-semibold text-ink">+50&nbsp;Б</b>. Один email —
        один аккаунт.
      </>
    ),
    cta: { href: "/auth", label: "Войти →" },
  },
  {
    n: "02",
    title: "Получаешь свой QR",
    body: (
      <>
        В&nbsp;кабинете — твой персональный QR-код. Показывай
        с&nbsp;телефона или закажи{" "}
        <b className="font-semibold text-ink">брелок</b> с&nbsp;этим же кодом.
        Это твой пропуск для&nbsp;отметки на&nbsp;пробежке. Ни&nbsp;Strava,
        ни&nbsp;часов с&nbsp;GPS не&nbsp;нужно.
      </>
    ),
    cta: { href: "/app/profile", label: "Профиль →" },
  },
  {
    n: "03",
    title: `Приходишь в среду в ${CLUB.runTime}`,
    body: (
      <>
        Одна из&nbsp;трёх точек на&nbsp;выбор: Центр (Карла Маркса 41),
        Проспект (Проспект Октября 63А), Черниковка (Первомайская 22).
        Дистанция и&nbsp;темп — любые, это{" "}
        <b className="font-semibold text-ink">не&nbsp;важно</b>. Просто прибегай.
      </>
    ),
    cta: { href: "/districts", label: "Точки старта →" },
  },
  {
    n: "04",
    title: "Отмечаешься QR — баллы за приход",
    body: (
      <>
        На&nbsp;точке подносишь QR к&nbsp;сканеру — пробежка засчитана,
        на&nbsp;счёт падает{" "}
        <b className="font-semibold text-ink">+{CLUB.runPoints}&nbsp;Б</b>{" "}
        за&nbsp;приход. Дистанция и&nbsp;время не&nbsp;влияют — баллы
        за&nbsp;то, что ты&nbsp;пришёл. Видно в&nbsp;истории сразу.
      </>
    ),
    cta: { href: "/app/points", label: "История баллов →" },
  },
  {
    n: "05",
    title: "Остаёшься на кофе",
    body: (
      <>
        После пробежки идём в&nbsp;{" "}
        <b className="font-semibold text-ink">Monkey Grinder</b> или{" "}
        <b className="font-semibold text-ink">Surf Coffee</b> — это наши
        кофейни-партнёры. Знакомства, разговоры, иногда — книжный клуб
        или летние coffee ride'ы. Баллы тратятся прямо там же.
      </>
    ),
    cta: { href: "/partners", label: "Партнёры →" },
  },
];

export default async function HowItWorksPage() {
  const state = await getSiteState();
  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="как это работает"
        title={
          <>
            Как это{" "}
            <em className="not-italic text-brand-red">работает</em>.
          </>
        }
        lede={
          <>
            Сити Раннинг — открытое беговое сообщество с&nbsp;регулярными
            пробежками по&nbsp;средам. Регистрируешься один раз, приходишь
            на&nbsp;пробежку, отмечаешься своим QR на&nbsp;точке, получаешь
            баллы и&nbsp;используешь их&nbsp;у&nbsp;партнёров.
          </>
        }
      />

      <section className="border-b border-ink">
        <Wrap className="py-16 lg:py-24">
          <div className="grid grid-cols-1 border border-ink md:grid-cols-2 lg:grid-cols-1">
            {STEPS.map((s, idx) => (
              <article
                key={s.n}
                className={
                  "flex flex-col gap-4 p-6 md:p-8 lg:flex-row lg:items-start lg:gap-12 lg:p-10" +
                  (idx > 0
                    ? " border-t border-ink md:border-t-0 md:[&:nth-child(odd)]:border-l-0 md:[&:nth-child(even)]:border-l md:[&:nth-child(n+3)]:border-t lg:border-l-0 lg:[&]:border-t lg:[&:first-child]:border-t-0"
                    : "")
                }
              >
                <span
                  className="font-display text-[80px] font-bold leading-none tracking-[-0.04em] text-muted lg:w-[140px] lg:flex-none lg:text-[120px]"
                >
                  {s.n}
                </span>
                <div className="flex flex-1 flex-col gap-3">
                  <h3 className="type-h3">{s.title}</h3>
                  <p className="text-[15px] leading-[1.55] text-graphite">
                    {s.body}
                  </p>
                  <Link
                    href={s.cta.href}
                    className="self-start font-sans text-[14px] font-semibold text-ink hover:text-brand-red"
                  >
                    {s.cta.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink bg-paper-2/60">
        <Wrap className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="type-h2 max-w-2xl">
            Не разобрался? Напиши{" "}
            <em className="not-italic text-brand-red">в&nbsp;Telegram</em>.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/faq"
              className="inline-flex h-12 items-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              FAQ
            </Link>
            <a
              href="mailto:cityrnng@yandex.com"
              className="inline-flex h-12 items-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              Написать нам
            </a>
          </div>
        </Wrap>
      </section>
    </PageShell>
  );
}
