import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { CLUB, DISTANCE_RANGE } from "@/lib/club";
import { LOCATIONS } from "@/lib/home-mock";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Районы · CITYRNNG" };

/** Build a Yandex.Maps URL pointing at the venue address — opens in new tab. */
function yandexMapsUrl(query: string): string {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}

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
            {list.map((loc, idx) => {
              const mapQuery = loc.venue
                ? `${loc.venue} ${CLUB.city}`
                : `${loc.district} ${CLUB.city}`;
              return (
                <article
                  key={loc.slug}
                  id={loc.slug}
                  className={
                    "scroll-mt-24 grid grid-cols-1 gap-6 p-6 md:grid-cols-[260px_minmax(0,1fr)_auto] md:items-start md:gap-10 md:p-10" +
                    (idx > 0 ? " border-t border-ink" : "")
                  }
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="type-mono-caps">
                      район {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-display text-[36px] font-bold leading-[0.95] tracking-[-0.025em] text-ink break-words md:text-[44px]">
                      {loc.district}
                    </h2>
                  </div>

                  <dl className="flex flex-col divide-y divide-ink/15 text-[14px]">
                    <Row k="Точка старта" v={loc.venue} placeholder="уточняется" />
                    <Row k="Ориентир" v={loc.landmark} placeholder="уточняется" />
                    <Row k="Время" v={`${CLUB.runDayLong} · ${CLUB.runTime}`} />
                    <Row k="Дистанции" v={DISTANCE_RANGE} />
                  </dl>

                  <div className="flex flex-col gap-2 md:items-stretch md:min-w-[200px]">
                    <Link
                      href={`/events?district=${loc.slug}`}
                      className="inline-flex h-11 items-center justify-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
                    >
                      Пробежки здесь →
                    </Link>
                    <a
                      href={yandexMapsUrl(mapQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
                    >
                      Открыть на&nbsp;карте ↗
                    </a>
                  </div>
                </article>
              );
            })}
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
            href={`mailto:${CLUB.contacts.email}`}
            className="inline-flex h-12 items-center self-start border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
          >
            {CLUB.contacts.email}
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
    <div className="flex min-h-[44px] items-center justify-between gap-4 py-2.5">
      <dt className="whitespace-nowrap text-muted">{k}</dt>
      <dd
        className={
          "min-w-0 truncate text-right " + (v ? "text-ink" : "text-muted")
        }
        title={v ?? placeholder ?? "—"}
      >
        {v ?? placeholder ?? "—"}
      </dd>
    </div>
  );
}
