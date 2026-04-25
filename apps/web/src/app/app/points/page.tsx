import Link from "next/link";
import { redirect } from "next/navigation";
import { PointsHistoryList } from "@/components/app/points-history";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { getPointsBalance, getPointsHistory } from "@/lib/api-points";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Баллы · CITYRNNG" };

const PAGE_SIZE = 25;

export default async function PointsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [balance, history, state] = await Promise.all([
    getPointsBalance(),
    getPointsHistory({ limit: PAGE_SIZE }),
    getSiteState(),
  ]);

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <Link
              href="/app"
              className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
            >
              ← Дашборд
            </Link>
            <span className="type-mono-caps mt-4 block">баланс</span>
            <h1
              className="type-hero text-brand-red"
              style={{ fontSize: 120, lineHeight: 0.85 }}
            >
              {balance ? balance.balance : "—"}
              <span className="ml-3 align-middle font-mono text-[24px] font-medium tracking-[0.04em] text-ink">
                Б
              </span>
            </h1>
          </Wrap>
        </section>

        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <div className="mb-6 flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <span className="type-mono-caps">история</span>
                <h2 className="type-h2">
                  {history.rows.length > 0
                    ? "Операции по баллам"
                    : "Операций пока нет"}
                </h2>
              </div>
            </div>

            {history.rows.length === 0 ? (
              <EmptyHistory />
            ) : (
              <PointsHistoryList initial={history} pageSize={PAGE_SIZE} />
            )}
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-start gap-4 border border-ink bg-paper-2 p-8">
      <span className="type-mono-caps">пока пусто</span>
      <p className="max-w-[520px] text-[15px] leading-[1.55] text-graphite">
        Первые баллы прилетают за&nbsp;регистрацию и&nbsp;первую среду.
        Подключи Strava — и&nbsp;операции появятся здесь автоматически.
      </p>
      <Link
        href="/app/profile"
        className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
      >
        Профиль и&nbsp;Strava →
      </Link>
    </div>
  );
}
