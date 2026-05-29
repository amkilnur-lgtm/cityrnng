import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import {
  ensureStravaSubscriptionAction,
  removeStravaSubscriptionAction,
} from "./actions";
import { getStravaSubscriptionStatus } from "@/lib/api-admin-strava";

export const metadata = { title: "Strava webhook · Admin · CITYRNNG" };

export default async function AdminStravaIntegrationPage() {
  const status = await getStravaSubscriptionStatus();
  const sub = status?.subscription ?? null;
  const callbackUrl = status?.callbackUrl ?? "(нет соединения с API)";

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Дашборд
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            Strava webhook subscription
          </h1>
          <p className="type-lede mt-3 max-w-2xl">
            Push-subscription регистрируется один раз на всё приложение. После
            этого Strava сама шлёт нам события о новых, изменённых и удалённых
            активностях — поллинг не нужен.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-10">
          <div className="flex flex-col gap-4 border border-ink bg-paper p-6 md:p-8">
            <Row k="Callback URL" v={callbackUrl} />
            <Row k="Subscription ID" v={sub ? String(sub.id) : "—"} />
            <Row
              k="Зарегистрирована"
              v={sub ? new Date(sub.created_at).toLocaleString("ru-RU") : "—"}
            />
            <Row
              k="Callback в Strava"
              v={sub ? sub.callback_url : "—"}
            />
            <div className="flex flex-wrap gap-3 pt-2">
              <form action={ensureStravaSubscriptionAction}>
                <SubmitButton primary>
                  {sub ? "Пересоздать subscription" : "Зарегистрировать"}
                </SubmitButton>
              </form>
              {sub ? (
                <form action={removeStravaSubscriptionAction}>
                  <SubmitButton>Удалить subscription</SubmitButton>
                </form>
              ) : null}
            </div>
          </div>

          {sub && sub.callback_url !== callbackUrl ? (
            <div className="mt-4 border border-brand-red bg-brand-tint/40 p-4 text-[13px] text-brand-red-ink">
              ⚠ Stale callback URL — нажми «Пересоздать subscription», чтобы
              Strava начала слать на актуальный домен.
            </div>
          ) : null}

          <p className="mt-6 max-w-2xl text-[13px] text-muted">
            Перед регистрацией убедись, что в .env заполнены{" "}
            <code className="bg-paper-2 px-1.5 py-0.5 font-mono text-[12px] text-ink">
              STRAVA_WEBHOOK_VERIFY_TOKEN
            </code>{" "}
            и{" "}
            <code className="bg-paper-2 px-1.5 py-0.5 font-mono text-[12px] text-ink">
              STRAVA_WEBHOOK_CALLBACK_ORIGIN
            </code>
            . Без них Strava отклонит handshake-проверку или мы не сможем
            построить публичный URL.
          </p>
        </Wrap>
      </section>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-4 border-b border-ink/15 pb-2 text-[14px]">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-mono text-ink">{v}</dd>
    </div>
  );
}

function SubmitButton({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="submit"
      className={
        "inline-flex h-11 items-center px-4 font-sans text-[14px] font-semibold transition-colors " +
        (primary
          ? "border border-brand-red bg-brand-red text-paper hover:bg-brand-red-ink"
          : "border border-ink bg-paper text-ink hover:bg-ink hover:text-paper")
      }
    >
      {children}
    </button>
  );
}
