import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "FAQ · CITYRNNG" };

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: "А я никогда не бегал. Точно подойдёт?",
    a: (
      <>
        Да. {CLUB.name} собирает людей с&nbsp;любым опытом — кто-то
        бегает 10 лет, кто-то впервые надел кроссовки. На&nbsp;точке
        старта ты&nbsp;не&nbsp;будешь самым медленным, обещаем. Темп —
        твой.
      </>
    ),
  },
  {
    q: "Сколько стоит участие?",
    a: <>Бесплатно. Никаких подписок, членских взносов и&nbsp;абонементов.</>,
  },
  {
    q: "Нужно записываться заранее?",
    a: (
      <>
        Нет. Регистрируешься в&nbsp;клубе один раз, дальше просто приходишь
        на&nbsp;любую из&nbsp;трёх точек в&nbsp;{CLUB.runTime}. Никаких
        квот и&nbsp;брони.
      </>
    ),
  },
  {
    q: "Какая дистанция?",
    a: (
      <>
        Каждая пробежка — {DISTANCE_RANGE} на&nbsp;выбор. Решаешь
        на&nbsp;старте, заранее ничего фиксировать не&nbsp;нужно. Можно
        в&nbsp;первый раз попробовать 5&nbsp;км, через месяц перейти
        на&nbsp;10.
      </>
    ),
  },
  {
    q: "Какой темп?",
    a: (
      <>
        Любой. Бежишь, идёшь, чередуешь — без разницы. Цель — добраться
        до&nbsp;финиша и&nbsp;остаться на&nbsp;кофе.
      </>
    ),
  },
  {
    q: "Что если я отстану?",
    a: (
      <>
        Никто не&nbsp;убежит вперёд и&nbsp;не&nbsp;бросит. У&nbsp;нас
        несколько темповых групп, в&nbsp;конце маршрута собираемся
        вместе и&nbsp;идём в&nbsp;кофейню.
      </>
    ),
  },
  {
    q: "Что если пропустил неделю?",
    a: (
      <>
        Ничего. Никаких штрафов, никаких «возвратов». Не&nbsp;было
        у&nbsp;тебя забега — не&nbsp;было начисления баллов.
        На&nbsp;следующей неделе снова стартуем.
      </>
    ),
  },
  {
    q: "А зимой бегаете?",
    a: (
      <>
        Да, круглый год. За&nbsp;3&nbsp;года отменили пробежку один раз —
        когда были сильные морозы. В&nbsp;остальное время бежим.
      </>
    ),
  },
  {
    q: "Зачем нужна Strava?",
    a: (
      <>
        Strava — единственный способ узнать, что ты&nbsp;действительно
        пробежал. Альтернатив (QR на&nbsp;старте, ручная отметка)
        у&nbsp;нас нет — это сознательное решение, чтобы
        не&nbsp;было накруток. Без подключения Strava ты&nbsp;всё равно
        можешь прийти, просто баллы не&nbsp;начислятся.
      </>
    ),
  },
  {
    q: "У меня Garmin / Apple Watch.",
    a: (
      <>
        Подключи их к&nbsp;Strava — обычно делается в&nbsp;настройках
        часов. Дальше Strava импортирует активности автоматически. Мы
        работаем только со&nbsp;Strava как источником.
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
        Кофе у&nbsp;Monkey Grinder и&nbsp;Surf Coffee, выпечка,
        книги и&nbsp;спецпредложения партнёров. Каталог в&nbsp;разделе
        «Магазин» (после регистрации).
      </>
    ),
  },
  {
    q: "Где старт?",
    a: (
      <>
        Три точки в&nbsp;{CLUB.cityGenitive}: Центр, Проспект, Черниковка.
        Стартуем одновременно в&nbsp;19:30. Подробности —{" "}
        <Link
          href="/districts"
          className="text-brand-red underline-offset-4 hover:underline"
        >
          на странице районов
        </Link>
        .
      </>
    ),
  },
  {
    q: "А если просто хочется кофе и поговорить?",
    a: (
      <>
        Тоже приходи. У&nbsp;нас есть книжный клуб (раз в&nbsp;месяц),
        летние coffee ride'ы на&nbsp;велосипедах и&nbsp;квиз-команды. Бег —
        повод собраться, но&nbsp;не&nbsp;единственный.
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
            Что{" "}
            <em className="not-italic text-brand-red">обычно</em> спрашивают.
          </>
        }
        lede={`Если ответа здесь нет — напиши на ${CLUB.contacts.email}, добавим.`}
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
