import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "О проекте · CITYRNNG" };

export default async function AboutPage() {
  const state = await getSiteState();

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="о проекте"
        title={
          <>
            Соседи, <em className="not-italic text-brand-red">кофейни</em>,{" "}
            маршрут по&nbsp;средам.
          </>
        }
        lede={`${CLUB.name} — городской беговой клуб ${CLUB.cityGenitive}, который существует с ${CLUB.foundedYear} года.`}
      />

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-[2fr_1fr] lg:py-16">
          <div className="prose-cityrnng flex flex-col gap-5 text-[16px] leading-[1.65] text-graphite">
            <p>
              CITYRNNG — это <b className="font-semibold text-ink">не&nbsp;спортивный сервис</b>.
              Это попытка сделать так, чтобы{" "}
              <b className="font-semibold text-ink">соседи знакомились</b>{" "}
              на&nbsp;улице, а&nbsp;не в&nbsp;соцсетях.
            </p>
            <p>
              Раз в&nbsp;неделю мы&nbsp;собираемся в&nbsp;парке —{" "}
              {CLUB.runDayLong} в&nbsp;{CLUB.runTime}. Бежим {DISTANCE_RANGE},
              кто как хочет. На&nbsp;финише — кофе у&nbsp;партнёра.
              Никаких медалей, никаких рейтингов, никаких подписок.
            </p>
            <p>
              За&nbsp;пробежку мы&nbsp;начисляем баллы. Эти баллы можно
              обменять у&nbsp;тех же&nbsp;кофеен, пекарен, книжных,
              которые держат твои же&nbsp;соседи. Чем больше людей бегают —
              тем больше партнёров. Замкнутый круг, но&nbsp;в&nbsp;хорошем
              смысле.
            </p>
            <p>
              Мы&nbsp;сознательно не&nbsp;строим ещё одну Strava. Strava
              у&nbsp;нас — только как датчик факта пробежки. Всё
              остальное — про живое общение, про{" "}
              <b className="font-semibold text-ink">район</b>, про{" "}
              <b className="font-semibold text-ink">кофе</b>.
            </p>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="border border-ink bg-paper p-6">
              <span className="type-mono-caps">принципы</span>
              <ul className="mt-4 flex flex-col gap-2.5 text-[14px] leading-[1.5] text-graphite">
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Бесплатно. Всегда.
                </li>
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Без записи на&nbsp;каждое событие.
                </li>
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Без рейтингов и&nbsp;медалей.
                </li>
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Локальные партнёры, не&nbsp;федеральные сетки.
                </li>
                <li>
                  <span className="font-mono text-brand-red">→ </span>
                  Никаких пушей с&nbsp;«не&nbsp;забудь побежать».
                </li>
              </ul>
            </div>

            <div className="border border-ink bg-paper-2 p-6">
              <span className="type-mono-caps">контакты</span>
              <ul className="mt-4 flex flex-col gap-2 text-[14px] text-graphite">
                <li>
                  <a
                    className="text-ink hover:text-brand-red"
                    href="mailto:hello@cityrnng.ru"
                  >
                    hello@cityrnng.ru
                  </a>
                </li>
                <li>
                  <a
                    className="text-ink hover:text-brand-red"
                    href="https://t.me/cityrnng"
                  >
                    Telegram-канал
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </Wrap>
      </section>

      <section className="border-b border-ink bg-paper-2/60">
        <Wrap className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="type-h2 max-w-2xl">
            Хочешь бежать?{" "}
            <em className="not-italic text-brand-red">Заходи</em>.
          </h2>
          <Link
            href="/auth"
            className="inline-flex h-12 items-center self-start border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            Войти в&nbsp;клуб →
          </Link>
        </Wrap>
      </section>
    </PageShell>
  );
}
