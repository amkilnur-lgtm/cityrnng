import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE, pointsForDistance } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Как это работает · CITYRNNG" };

const STEPS = [
  {
    n: "01",
    title: "Регистрируешься один раз",
    body: (
      <>
        По&nbsp;email через магик-линк — без пароля. Сразу прилетают{" "}
        <b className="font-semibold text-ink">+50 баллов</b> приветственных.
        Один email = один аккаунт, повторно регистрироваться не&nbsp;нужно.
      </>
    ),
    cta: { href: "/auth", label: "Войти →" },
  },
  {
    n: "02",
    title: "Подключаешь Strava",
    body: (
      <>
        В&nbsp;профиле жмёшь «Подключить Strava» — стандартный OAuth.
        Это{" "}
        <b className="font-semibold text-ink">единственный способ</b>,
        которым мы&nbsp;узнаём что ты&nbsp;добежал. Garmin / Apple Watch —
        тоже подойдут, если они синкаются со&nbsp;Strava.
      </>
    ),
    cta: { href: "/app/profile", label: "Профиль →" },
  },
  {
    n: "03",
    title: `Приходишь в ${CLUB.runDayLong} в ${CLUB.runTime}`,
    body: (
      <>
        Одна из&nbsp;трёх точек на&nbsp;выбор: Центр (Карла Маркса 41),
        Проспект (Проспект Октября 63А), Черниковка (Первомайская 22).
        Дистанция — <b className="font-semibold text-ink">{DISTANCE_RANGE}</b>,
        выбираешь на&nbsp;месте. Темп любой.
      </>
    ),
    cta: { href: "/districts", label: "Точки старта →" },
  },
  {
    n: "04",
    title: "Strava фиксирует, баллы прилетают",
    body: (
      <>
        После пробежки матчер сравнит активность с&nbsp;окном события
        и&nbsp;начислит автоматически:{" "}
        <b className="font-semibold text-ink">
          +{pointsForDistance(5)}&nbsp;Б за&nbsp;5&nbsp;км
        </b>
        ,{" "}
        <b className="font-semibold text-ink">
          +{pointsForDistance(10)}&nbsp;Б за&nbsp;10&nbsp;км
        </b>
        . Видно в&nbsp;истории сразу.
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
            Пять шагов от&nbsp;
            <em className="not-italic text-brand-red">кроссовок</em>{" "}
            до&nbsp;кофе.
          </>
        }
        lede={
          <>
            {CLUB.name} — открытое беговое сообщество. Без записи, без
            секундомера, без подписки. Регистрируешься один раз, дальше всё
            работает само: пришёл в&nbsp;среду, пробежал, остался
            на&nbsp;кофе с&nbsp;командой.
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
                  className="font-display text-[80px] font-bold leading-none tracking-[-0.04em] text-muted-2 lg:w-[140px] lg:flex-none lg:text-[120px]"
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
            Не понятно? Напиши{" "}
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
              href="mailto:hello@cityrunning.online"
              className="inline-flex h-12 items-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              hello@cityrunning.online
            </a>
          </div>
        </Wrap>
      </section>
    </PageShell>
  );
}
