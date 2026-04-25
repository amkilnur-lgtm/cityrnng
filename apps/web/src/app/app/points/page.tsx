import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import {
  getPointsBalance,
  getPointsHistory,
  reasonLabel,
  type PointsTxn,
} from "@/lib/api-points";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Баллы · CITYRNNG" };

export default async function PointsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [balance, history, state] = await Promise.all([
    getPointsBalance(),
    getPointsHistory({ limit: 50 }),
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
              <span
                className="ml-3 align-middle font-mono text-[24px] font-medium tracking-[0.04em] text-ink"
              >
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
                    ? `Последние ${history.rows.length} операций`
                    : "Операций пока нет"}
                </h2>
              </div>
              {history.nextCursor ? (
                <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
                  есть ещё — пагинация в&nbsp;следующем апдейте
                </span>
              ) : null}
            </div>

            {history.rows.length === 0 ? (
              <EmptyHistory />
            ) : (
              <ul className="flex flex-col border border-ink">
                {history.rows.map((t, idx) => (
                  <li
                    key={t.id}
                    className={
                      idx > 0 ? "border-t border-ink/15" : undefined
                    }
                  >
                    <TxnRow t={t} />
                  </li>
                ))}
              </ul>
            )}
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function TxnRow({ t }: { t: PointsTxn }) {
  const isCredit = t.direction === "credit";
  const sign = isCredit ? "+" : "−";
  const dt = new Date(t.createdAt);
  const date = dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
  const time = dt.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[120px_1fr_auto] md:px-6">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] tracking-[0.04em] text-ink">
          {date}
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
          {time}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-medium text-ink">
          {reasonLabel(t.reasonType)}
        </span>
        {t.comment ? (
          <span className="text-[12px] text-muted">{t.comment}</span>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={
            "font-mono text-[16px] font-medium tracking-[0.04em] " +
            (isCredit ? "text-brand-red" : "text-ink")
          }
        >
          {sign}
          {t.amount}&nbsp;Б
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
          → {t.balanceAfter}&nbsp;Б
        </span>
      </div>
    </div>
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
