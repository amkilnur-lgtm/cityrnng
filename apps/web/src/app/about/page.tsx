import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "О проекте · CITYRNNG" };

const VALUES = [
  {
    n: "01",
    title: "Бег для всех",
    body: "Любой опыт, любой темп, любая форма. Важно, что ты пришёл — не то, насколько готов.",
  },
  {
    n: "02",
    title: "Низкий порог входа",
    body: "Чтобы присоединиться, не нужно быть «своим». Не нужно быть быстрым, спортивным, сильным. Достаточно просто прийти.",
  },
  {
    n: "03",
    title: "Комьюнити, а не клуб профи",
    body: "Поддержка, уважение, лёгкое общение. Никто никому ничего не доказывает.",
  },
  {
    n: "04",
    title: "Бег — это процесс",
    body: "Не только километры. Регулярность, привычка двигаться, маленькие шаги, разговоры после.",
  },
  {
    n: "05",
    title: "Город как часть опыта",
    body: "Маршруты, улицы, точки встреч, кофейни, знакомые лица — всё это часть бега.",
  },
  {
    n: "06",
    title: "Регулярность",
    body: "Не разовая красивая акция. Бегаем круглый год, отмен почти не было — даже в -25°.",
  },
  {
    n: "07",
    title: "Открытость",
    body: "Настоящие знакомства, общение, идеи. Тут находят друзей, партнёров, новые связи.",
  },
];

export default async function AboutPage() {
  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow={`беговое сообщество ${CLUB.cityGenitive} · с ${CLUB.foundedYear}`}
        title={
          <>
            Беги по&nbsp;городу.{" "}
            <em className="not-italic text-brand-red">Не&nbsp;один.</em>
          </>
        }
        lede={`${CLUB.name} — это про то, что бег не должен быть страшным, сложным или «только для подготовленных». Достаточно прийти. Дальше всё происходит само.`}
      />

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-[2fr_1fr] lg:py-16">
          <div className="flex flex-col gap-5 text-[16px] leading-[1.65] text-graphite">
            <span className="type-mono-caps">миссия</span>
            <h2 className="type-h2">
              Сделать бег{" "}
              <em className="not-italic text-brand-red">понятным</em>,{" "}
              доступным и&nbsp;живым для каждого.
            </h2>
            <p>
              Мы&nbsp;верим, что бег это не&nbsp;только тренировка.
              Это весь процесс вокруг: собраться, выйти из&nbsp;дома,
              встретиться с&nbsp;людьми, пробежать вместе, поговорить после,
              выпить кофе, завести знакомства, почувствовать{" "}
              {CLUB.city} и&nbsp;стать частью сообщества.
            </p>
            <p>
              Нам важны не&nbsp;километры и&nbsp;темп — а&nbsp;то, что
              рядом свои люди. Что можно прийти впервые
              и&nbsp;не&nbsp;чувствовать себя лишним. Что человек
              раскрывается через несколько встреч и&nbsp;становится частью
              костяка.
            </p>
            <p>
              {CLUB.name} помогает легче входить в&nbsp;движение,
              чувствовать себя менее одиноко в&nbsp;городе, находить круг
              общения и&nbsp;выстраивать живой, активный образ жизни —
              без давления и&nbsp;спортивного снобизма.
            </p>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="border border-ink bg-paper p-6">
              <span className="type-mono-caps">основатели</span>
              <ul className="mt-4 flex flex-col gap-2 text-[15px] text-ink">
                {CLUB.founders.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-muted">
                Запустили {CLUB.name} в&nbsp;{CLUB.foundedYear} году.
              </p>
            </div>

            <div className="border border-ink bg-paper p-6">
              <span className="type-mono-caps">и ещё</span>
              <ul className="mt-4 flex flex-col gap-2.5 text-[14px] leading-[1.5] text-graphite">
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Книжный клуб — раз в&nbsp;месяц, обсуждаем выбранную книгу
                </li>
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Coffee ride'ы — летом, по&nbsp;воскресеньям,
                  велосипедные 15-20&nbsp;км
                </li>
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Команды по&nbsp;квизу — регулярно занимаем первые места
                </li>
              </ul>
            </div>

            <div className="border border-ink bg-paper-2 p-6">
              <span className="type-mono-caps">контакты</span>
              <ul className="mt-4 flex flex-col gap-2 text-[14px] text-graphite">
                <li>
                  <a
                    className="text-ink hover:text-brand-red"
                    href={`mailto:${CLUB.contacts.email}`}
                  >
                    {CLUB.contacts.email}
                  </a>
                </li>
                <li>
                  <a
                    className="text-ink hover:text-brand-red"
                    href={CLUB.contacts.telegram}
                  >
                    Telegram
                  </a>
                </li>
                <li>
                  <a
                    className="text-ink hover:text-brand-red"
                    href={CLUB.contacts.instagram}
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-12 lg:py-16">
          <div className="mb-8 flex flex-col gap-3">
            <span className="type-mono-caps">ценности</span>
            <h2 className="type-h2">
              На&nbsp;чём{" "}
              <em className="not-italic text-brand-red">держимся</em>.
            </h2>
          </div>
          <div className="grid grid-cols-1 border border-ink md:grid-cols-2 lg:grid-cols-2">
            {VALUES.map((v, idx) => (
              <article
                key={v.n}
                className={
                  "flex flex-col gap-3 p-6 md:p-8" +
                  (idx > 0
                    ? " border-t border-ink md:[&:nth-child(odd)]:border-l-0 md:[&:nth-child(even)]:border-l md:[&:nth-child(2)]:border-t-0"
                    : "")
                }
              >
                <span className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-muted-2">
                  {v.n}
                </span>
                <h3 className="type-h3">{v.title}</h3>
                <p className="text-[14px] leading-[1.55] text-graphite">
                  {v.body}
                </p>
              </article>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink bg-paper-2/60">
        <Wrap className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="type-h2 max-w-2xl">
            Хочешь бегать с&nbsp;нами?{" "}
            <em className="not-italic text-brand-red">Присоединяйся</em>.
          </h2>
          <Link
            href="/auth"
            className="inline-flex h-12 items-center self-start border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            Присоединиться →
          </Link>
        </Wrap>
      </section>
    </PageShell>
  );
}
