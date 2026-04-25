import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "FAQ · CITYRNNG" };

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: "Сколько стоит участие?",
    a: <>Бесплатно. Никаких подписок и&nbsp;членских взносов.</>,
  },
  {
    q: "Нужно ли записываться на каждую среду?",
    a: (
      <>
        Нет. Регистрируешься в&nbsp;клубе один раз, дальше просто приходишь
        в&nbsp;{CLUB.runTime} в&nbsp;один из&nbsp;районов. Strava сама
        зафиксирует, что ты&nbsp;добежал.
      </>
    ),
  },
  {
    q: "Какая дистанция?",
    a: (
      <>
        Каждая среда — {DISTANCE_RANGE} на&nbsp;выбор. Решаешь
        на&nbsp;старте, никаких заявок заранее. Можно попробовать
        5&nbsp;км в&nbsp;первый раз, через месяц перейти на&nbsp;10.
      </>
    ),
  },
  {
    q: "Какой темп?",
    a: (
      <>
        Любой. Бежишь, идёшь, чередуешь — без разницы. Цель — добраться
        до&nbsp;финиша и&nbsp;выпить кофе с&nbsp;соседями.
      </>
    ),
  },
  {
    q: "Что если пропустил среду?",
    a: (
      <>
        Ничего. Никаких штрафов, никаких «возвратов». Не&nbsp;было
        у&nbsp;тебя забега — не&nbsp;будет начисления баллов. На&nbsp;
        следующей среде снова стартуем.
      </>
    ),
  },
  {
    q: "Зачем нужна Strava?",
    a: (
      <>
        Strava — единственный способ узнать, что ты&nbsp;действительно
        пробежал. Альтернатив (QR на&nbsp;старте, ручная регистрация)
        у&nbsp;нас нет — это сознательное решение, чтобы не&nbsp;было
        накруток. Без подключения Strava ты&nbsp;всё равно можешь
        прийти, просто баллы не&nbsp;начислятся.
      </>
    ),
  },
  {
    q: "Что если у меня Garmin / Apple Watch?",
    a: (
      <>
        Подключи их к&nbsp;Strava — чаще всего это делается в&nbsp;настройках
        часов. Дальше Strava импортирует активности автоматически. В&nbsp;MVP
        мы&nbsp;поддерживаем только Strava как источник.
      </>
    ),
  },
  {
    q: "Сколько баллов за пробежку?",
    a: (
      <>
        +30&nbsp;Б за&nbsp;5&nbsp;км, +60&nbsp;Б за&nbsp;10&nbsp;км. Плюс
        +50&nbsp;Б при регистрации. Бонусы за&nbsp;серии и&nbsp;спецсобытия
        в&nbsp;разработке.
      </>
    ),
  },
  {
    q: "На что менять баллы?",
    a: (
      <>
        Кофе, круассаны, абонементы у&nbsp;партнёров клуба. Каталог
        в&nbsp;разделе «Магазин» (после регистрации). Партнёров пока
        мало — будем добавлять каждую неделю.
      </>
    ),
  },
  {
    q: "Где старт?",
    a: (
      <>
        Среда ротируется по&nbsp;трём районам {CLUB.cityGenitive}. Точные
        точки старта — на&nbsp;странице{" "}
        <Link href="/districts" className="text-brand-red underline-offset-4 hover:underline">
          «Районы»
        </Link>
        .
      </>
    ),
  },
];

export default async function FaqPage() {
  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="вопросы и ответы"
        title={
          <>
            Десять <em className="not-italic text-brand-red">частых</em>{" "}
            вопросов.
          </>
        }
        lede="Если ответа здесь нет — напиши на hello@cityrnng.ru, добавим."
      />

      <section className="border-b border-ink">
        <Wrap className="py-12 lg:py-16">
          <ul className="flex flex-col border border-ink">
            {QA.map((item, idx) => (
              <li
                key={idx}
                className={
                  "flex flex-col gap-3 p-6 md:flex-row md:items-start md:gap-12 md:p-8" +
                  (idx > 0 ? " border-t border-ink/15" : "")
                }
              >
                <h3 className="font-display text-[20px] font-bold leading-tight tracking-[-0.01em] text-ink md:w-[280px] md:flex-none lg:text-[24px]">
                  {item.q}
                </h3>
                <p className="flex-1 text-[15px] leading-[1.55] text-graphite">
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </Wrap>
      </section>
    </PageShell>
  );
}
