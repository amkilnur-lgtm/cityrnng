import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import {
  MY_REDEMPTIONS,
  PARTNERS,
  REWARDS,
  type Redemption,
  type RedemptionStatus,
} from "@/lib/home-mock";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Мои обмены · CITYRNNG" };

const STATUS_LABEL: Record<RedemptionStatus, string> = {
  active: "Активен",
  used: "Использован",
  expired: "Истёк",
  cancelled: "Отменён",
};

const STATUS_TONE: Record<RedemptionStatus, string> = {
  active: "text-brand-red",
  used: "text-muted-2",
  expired: "text-muted-2",
  cancelled: "text-muted-2",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export default async function MyRewardsPage() {
  const state = await getSiteState();
  if (!state.isAuthed) redirect("/auth");

  const active = MY_REDEMPTIONS.filter((r) => r.status === "active");
  const past = MY_REDEMPTIONS.filter((r) => r.status !== "active");

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
            <span className="type-mono-caps mt-4 block">мои обмены</span>
            <h1 className="type-hero" style={{ fontSize: 64 }}>
              {active.length > 0 ? (
                <>
                  <em className="not-italic text-brand-red">
                    {active.length}{" "}
                    {active.length === 1
                      ? "активный"
                      : active.length < 5
                        ? "активных"
                        : "активных"}
                  </em>{" "}
                  код
                  {active.length === 1 ? "" : active.length < 5 ? "а" : "ов"}.
                </>
              ) : (
                <>Ни одного активного обмена пока.</>
              )}
            </h1>
            <p className="type-lede mt-2 max-w-xl">
              Покажи QR в&nbsp;кофейне-партнёре — бариста сканирует
              и&nbsp;отдаёт позицию.
            </p>
          </Wrap>
        </section>

        {active.length > 0 ? (
          <section className="border-b border-ink">
            <Wrap className="py-12 lg:py-16">
              <div className="mb-6 flex flex-col gap-2">
                <span className="type-mono-caps">активные</span>
                <h2 className="type-h2">
                  Готовы к&nbsp;
                  <em className="not-italic text-brand-red">обмену</em>.
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {active.map((r) => (
                  <RedemptionCard key={r.slug} redemption={r} />
                ))}
              </div>
            </Wrap>
          </section>
        ) : null}

        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <div className="mb-6 flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <span className="type-mono-caps">история</span>
                <h2 className="type-h2">
                  {past.length > 0
                    ? "Использованные и истёкшие"
                    : "Историй обменов пока нет"}
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
              >
                Магазин →
              </Link>
            </div>

            {past.length === 0 ? (
              <p className="text-[15px] text-graphite">
                Когда обменяешь баллы — появится здесь.
              </p>
            ) : (
              <ul className="flex flex-col border border-ink">
                {past.map((r, idx) => (
                  <li
                    key={r.slug}
                    className={
                      "flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between md:p-6" +
                      (idx > 0 ? " border-t border-ink/15" : "")
                    }
                  >
                    <PastRow redemption={r} />
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

function lookupReward(slug: string) {
  const reward = REWARDS.find((r) => r.slug === slug);
  if (!reward) return null;
  return { reward, partner: PARTNERS[reward.partnerSlug] };
}

function RedemptionCard({ redemption }: { redemption: Redemption }) {
  const found = lookupReward(redemption.rewardSlug);
  const expires = redemption.expiresAt ? fmtDate(redemption.expiresAt) : null;

  return (
    <article className="grid grid-cols-1 border border-ink md:grid-cols-[1fr_180px]">
      <div className="flex flex-col gap-3 border-b border-ink p-5 md:border-b-0 md:border-r md:p-6">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 animate-pulse bg-brand-red" />
          <span className={`type-mono-caps ${STATUS_TONE[redemption.status]}`}>
            {STATUS_LABEL[redemption.status]}
          </span>
        </div>
        {found ? (
          <>
            <h3 className="type-h3">{found.reward.title}</h3>
            <p className="text-[13px] text-graphite">
              {found.partner.name}
              {found.partner.locations.length > 0
                ? ` · ${found.partner.locations.join(", ")}`
                : ""}
            </p>
          </>
        ) : (
          <h3 className="type-h3 text-muted-2">Награда удалена</h3>
        )}
        <dl className="mt-auto flex flex-col gap-1.5 text-[12px]">
          <div className="flex justify-between border-t border-ink/15 pt-2">
            <dt className="text-muted">Списано</dt>
            <dd className="font-mono text-ink">
              −{redemption.costPoints}&nbsp;Б
            </dd>
          </div>
          {expires ? (
            <div className="flex justify-between">
              <dt className="text-muted">Действует до</dt>
              <dd className="font-mono text-ink">{expires}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">Получен</dt>
            <dd className="font-mono text-ink">
              {fmtDate(redemption.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 bg-paper-2 p-5 md:p-6">
        <QrPlaceholder code={redemption.code} />
        <span className="font-mono text-[18px] font-semibold tracking-[0.2em] text-ink">
          {redemption.code}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          код для бариста
        </span>
      </div>
    </article>
  );
}

function PastRow({ redemption }: { redemption: Redemption }) {
  const found = lookupReward(redemption.rewardSlug);

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`type-mono-caps ${STATUS_TONE[redemption.status]}`}>
            {STATUS_LABEL[redemption.status]}
          </span>
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted">
            {redemption.code}
          </span>
        </div>
        <span className="text-[15px] font-medium text-ink">
          {found?.reward.title ?? "Награда удалена"}
          {found ? <span className="text-muted"> · {found.partner.name}</span> : null}
        </span>
      </div>
      <div className="flex flex-col text-right md:items-end">
        <span className="font-mono text-[14px] font-medium text-ink">
          −{redemption.costPoints}&nbsp;Б
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
          {redemption.usedAt
            ? `использован ${fmtDateTime(redemption.usedAt)}`
            : `получен ${fmtDate(redemption.createdAt)}`}
        </span>
      </div>
    </>
  );
}

/**
 * Tiny stub QR — just a 7×7 grid of squares deterministic from the code.
 * Replaces a real QR until backend issues redemption codes that need scanning.
 * Visual placeholder: looks like a QR, isn't scannable. Bartender uses the
 * 6-char alphanumeric code below the grid.
 */
function QrPlaceholder({ code }: { code: string }) {
  const seed = Array.from(code).reduce((s, c) => s + c.charCodeAt(0), 0);
  const cells: boolean[] = [];
  for (let i = 0; i < 49; i++) {
    cells.push(((seed * (i + 1) * 31) % 7) > 3);
  }
  return (
    <div
      aria-hidden
      className="grid h-32 w-32 grid-cols-7 grid-rows-7 gap-px border border-ink p-1"
    >
      {cells.map((on, i) => (
        <span
          key={i}
          className={on ? "bg-ink" : "bg-paper"}
        />
      ))}
    </div>
  );
}
