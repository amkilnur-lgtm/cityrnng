import Link from "next/link";
import { Wrap } from "@/components/site/wrap";

export const metadata = { title: "Strava · Admin · CITYRNNG" };

export default function AdminStravaIndexPage() {
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
            Strava
          </h1>
          <p className="type-lede mt-3 max-w-2xl">
            Интеграция со Strava: подписка на webhook'и и диагностика
            матчинга. Сюда добавляются все настройки и инструменты, связанные
            со Strava-пайплайном.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-0">
          <div className="grid grid-cols-1 gap-0 border border-ink md:grid-cols-2">
            <Card
              href="/admin/strava/webhook"
              kind="01"
              title="Webhook subscription"
              body="Регистрация push-subscription на стороне Strava. Один раз настроил — и активности юзеров сами прилетают, без поллинга."
            />
            <Card
              href="/admin/strava/debug"
              kind="02"
              title="Дебаг матчинга"
              body="Покажет, какие активности юзера подтянулись из Strava и почему конкретные не сматчились с событиями (тип / окно / дистанция / геофенс)."
              borderLeft
            />
          </div>
        </Wrap>
      </section>
    </main>
  );
}

function Card({
  href,
  kind,
  title,
  body,
  borderLeft,
}: {
  href: string;
  kind: string;
  title: string;
  body: string;
  borderLeft?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-col gap-3 p-6 transition-colors hover:bg-paper-2 md:p-8 " +
        (borderLeft ? "md:border-l md:border-ink" : "")
      }
    >
      <span className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-muted-2">
        {kind}
      </span>
      <h3 className="type-h3">{title}</h3>
      <p className="text-[14px] leading-[1.55] text-graphite">{body}</p>
      <span className="mt-auto pt-2 font-sans text-[13px] font-medium text-ink">
        Открыть →
      </span>
    </Link>
  );
}
