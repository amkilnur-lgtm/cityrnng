import Link from "next/link";
import { Wrap } from "@/components/site/wrap";

export default function AdminDashboardPage() {
  return (
    <main>
      <section className="border-b border-ink bg-paper-2/40">
        <Wrap className="py-12 lg:py-16">
          <span className="type-mono-caps">админка</span>
          <h1 className="type-hero mt-3" style={{ fontSize: 56 }}>
            Дашборд.
          </h1>
          <p className="type-lede mt-3 max-w-2xl">
            Панель управления Сити Раннинг. Локации, события, награды
            и&nbsp;партнёры — всё здесь. Доступ только для роли{" "}
            <code className="font-mono text-[14px] text-ink">admin</code>.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-0 border border-ink py-0 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            href="/admin/locations"
            kind="01"
            title="Локации"
            body="Точки старта в городе — район, координаты, geofence-радиус для Strava-матчинга. От них зависят и регулярные события, и спецсобытия."
          />
          <DashboardCard
            href="/admin/partners"
            kind="02"
            title="Партнёры"
            body="Кофейни, пекарни, локальные бренды. Создаёшь партнёра один раз — потом добавляешь его награды отдельно."
          />
          <DashboardCard
            href="/admin/rewards"
            kind="03"
            title="Награды"
            body="Каталог обменов. Каждая награда привязана к партнёру, имеет цену в баллах, опциональные срок действия и капасити."
          />
          <ComingSoonCard
            kind="04"
            title="События"
            body="Создание разовых special-событий, статусы, sync-rules для Strava."
          />
          <ComingSoonCard
            kind="05"
            title="Расписание"
            body="Регулярные правила (среда 19:30 со всех точек) — генерируют события автоматически."
          />
          <ComingSoonCard
            kind="06"
            title="Attendances"
            body="Подтверждение участия из Strava-синков и ручные начисления."
          />
        </Wrap>
      </section>
    </main>
  );
}

function DashboardCard({
  href,
  kind,
  title,
  body,
}: {
  href: string;
  kind: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 border-b border-ink p-6 transition-colors hover:bg-paper-2 md:border-b-0 md:[&:nth-child(2n)]:border-l md:[&:nth-child(2n)]:border-ink md:[&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-ink lg:[&]:border-t-0 lg:[&:nth-child(2n)]:border-l-0 lg:[&:nth-child(3n+2)]:border-l lg:[&:nth-child(3n+2)]:border-ink lg:[&:nth-child(3n)]:border-l lg:[&:nth-child(3n)]:border-ink lg:[&:nth-child(n+4)]:border-t lg:[&:nth-child(n+4)]:border-ink md:p-8"
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

function ComingSoonCard({
  kind,
  title,
  body,
}: {
  kind: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink bg-paper-2 p-6 md:border-b-0 md:[&:nth-child(2n)]:border-l md:[&:nth-child(2n)]:border-ink md:[&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-ink lg:[&]:border-t-0 lg:[&:nth-child(2n)]:border-l-0 lg:[&:nth-child(3n+2)]:border-l lg:[&:nth-child(3n+2)]:border-ink lg:[&:nth-child(3n)]:border-l lg:[&:nth-child(3n)]:border-ink lg:[&:nth-child(n+4)]:border-t lg:[&:nth-child(n+4)]:border-ink md:p-8">
      <span className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-muted-2">
        {kind}
      </span>
      <h3 className="type-h3 text-muted">{title}</h3>
      <p className="text-[14px] leading-[1.55] text-muted">{body}</p>
      <span className="mt-auto pt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        скоро
      </span>
    </div>
  );
}
