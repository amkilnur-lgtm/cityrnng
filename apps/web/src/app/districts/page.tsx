import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { LOCATIONS } from "@/lib/home-mock";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Районы · CITYRNNG" };

export default async function DistrictsPage() {
  const state = await getSiteState();
  const list = Object.values(LOCATIONS);

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="районы клуба"
        title={
          <>
            <em className="not-italic text-brand-red">{list.length} района</em>{" "}
            {CLUB.cityGenitive}.
          </>
        }
        lede={
          <>
            Каждую {CLUB.runDayLong} стартуем в&nbsp;одном из&nbsp;районов
            ниже — {CLUB.runTime}, {DISTANCE_RANGE}. Маршруты повторяются,
            ориентир один. Подключаешь Strava — записываться
            не&nbsp;нужно.
          </>
        }
      />

      <section className="border-b border-ink">
        <Wrap className="py-12 lg:py-16">
          <div className="flex flex-col border border-ink">
            {list.map((loc, idx) => (
              <article
                key={loc.slug}
                id={loc.slug}
                className={
                  "scroll-mt-24 grid grid-cols-1 gap-4 p-6 md:grid-cols-[200px_1fr_auto] md:items-start md:gap-8 md:p-10" +
                  (idx > 0 ? " border-t border-ink" : "")
                }
              >
                <div className="flex flex-col gap-1">
                  <span className="type-mono-caps">район {String(idx + 1).padStart(2, "0")}</span>
                  <h2 className="font-display text-[40px] font-bold leading-none tracking-[-0.025em] text-ink md:text-[48px]">
                    {loc.district}
                  </h2>
                </div>

                <dl className="flex flex-col gap-2 text-[14px]">
                  <Row k="Точка старта" v={loc.venue} placeholder="уточняется" />
                  <Row k="Ориентир" v={loc.landmark} placeholder="уточняется" />
                  <Row k="Время" v={`${CLUB.runDayLong} · ${CLUB.runTime}`} />
                  <Row k="Дистанции" v={DISTANCE_RANGE} />
                </dl>

                <div className="flex flex-col gap-2 md:items-end">
                  <Link
                    href={`/events?district=${loc.slug}`}
                    className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
                  >
                    Среды здесь →
                  </Link>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
                    карта · скоро
                  </span>
                </div>
              </article>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink bg-paper-2/60">
        <Wrap className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="type-h2 max-w-2xl">
            Свой район не&nbsp;нашёл?{" "}
            <em className="not-italic text-brand-red">Напиши</em> — обсудим.
          </h2>
          <a
            href="mailto:hello@cityrnng.ru"
            className="inline-flex h-12 items-center self-start border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
          >
            hello@cityrnng.ru
          </a>
        </Wrap>
      </section>
    </PageShell>
  );
}

function Row({
  k,
  v,
  placeholder,
}: {
  k: string;
  v?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/15 py-1.5">
      <dt className="text-muted">{k}</dt>
      <dd className={"text-right " + (v ? "text-ink" : "text-muted-2")}>
        {v ?? placeholder ?? "—"}
      </dd>
    </div>
  );
}
