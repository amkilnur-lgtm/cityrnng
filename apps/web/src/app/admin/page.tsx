import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import {
  getDashboardSummary,
  type DashboardSummary,
  type SummaryEvent,
} from "@/lib/api-admin-strava";

export const metadata = { title: "Сводка · Админка · CITYRNNG" };

const RU_MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${RU_MONTHS_SHORT[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "никогда";
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "только что";
  if (diffSec < 3600) return `${Math.round(diffSec / 60)} мин назад`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)} ч назад`;
  return `${Math.round(diffSec / 86400)} дн назад`;
}

export default async function AdminDashboardPage() {
  const result = await getDashboardSummary();

  return (
    <main>
      <section className="border-b border-ink bg-paper-2/40">
        <Wrap className="py-10">
          <span className="type-mono-caps">админка</span>
          <h1 className="type-hero mt-3" style={{ fontSize: 48 }}>
            Сводка.
          </h1>
          <p className="type-lede mt-3 max-w-2xl">
            Что сейчас происходит в проекте. Разделы — слева в меню.
          </p>
        </Wrap>
      </section>

      {result.ok ? (
        <DashboardContent summary={result.data} />
      ) : (
        <ErrorState status={result.status} message={result.message} />
      )}
    </main>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  return (
    <>
      <HealthBar summary={summary} />
      <KpiStrip summary={summary} />
      <StravaFlowStrip summary={summary} />
      <EventsStrip summary={summary} />
    </>
  );
}

function HealthBar({ summary }: { summary: DashboardSummary }) {
  const ws = summary.health.webhookSubscription;
  const webhookOk = ws.active && ws.callbackMatches;
  const ingestStale =
    summary.health.lastIngestAt
      ? Date.now() - new Date(summary.health.lastIngestAt).getTime() > 24 * 3600 * 1000 &&
        summary.kpis.stravaConnected > 0
      : summary.kpis.stravaConnected > 0;

  return (
    <section className="border-b border-ink">
      <Wrap className="py-6">
        <div className="grid grid-cols-1 gap-0 border border-ink md:grid-cols-3">
          <HealthCell
            ok={webhookOk}
            label="Уведомления Strava"
            primary={
              ws.active
                ? ws.callbackMatches
                  ? `подписка №${ws.subscriptionId} активна`
                  : `подписка №${ws.subscriptionId} — адрес устарел`
                : "подписка не зарегистрирована"
            }
            secondary={
              <Link
                href="/admin/strava/webhook"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-brand-red"
              >
                Перейти →
              </Link>
            }
          />
          <HealthCell
            ok={!ingestStale}
            label="Последняя пробежка пришла"
            primary={fmtRelative(summary.health.lastIngestAt)}
            secondary={
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                в памяти {summary.health.cachedActivities} пробежек
              </span>
            }
            borderLeft
          />
          <HealthCell
            ok={true}
            label="Сервер"
            primary="работает"
            secondary={
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                детальная статистика — в Sentry
              </span>
            }
            borderLeft
          />
        </div>
      </Wrap>
    </section>
  );
}

function HealthCell({
  ok,
  label,
  primary,
  secondary,
  borderLeft,
}: {
  ok: boolean;
  label: string;
  primary: string;
  secondary?: React.ReactNode;
  borderLeft?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-2 p-5 " +
        (borderLeft ? "md:border-l md:border-ink" : "")
      }
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={
            "block h-2 w-2 " + (ok ? "bg-brand-red" : "bg-ink/30")
          }
        />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
      </div>
      <span className="font-sans text-[15px] font-semibold text-ink">{primary}</span>
      {secondary ? <span className="mt-auto">{secondary}</span> : null}
    </div>
  );
}

function KpiStrip({ summary }: { summary: DashboardSummary }) {
  const k = summary.kpis;
  const stravaPct =
    k.totalUsers > 0 ? Math.round((k.stravaConnected / k.totalUsers) * 100) : 0;
  return (
    <section className="border-b border-ink">
      <Wrap className="py-0">
        <div className="grid grid-cols-1 gap-0 border border-ink md:grid-cols-4">
          <Kpi
            label="Пользователей"
            value={k.totalUsers.toString()}
            sub={`+${k.newUsers7d} за неделю`}
          />
          <Kpi
            label="Подключено к Strava"
            value={k.stravaConnected.toString()}
            sub={`${stravaPct}% от всех`}
            borderLeft
          />
          <Kpi
            label="Активных бегунов за неделю"
            value={k.activeRunners7d.toString()}
            sub="хотя бы одна засчитанная пробежка"
            borderLeft
          />
          <Kpi
            label="Баллов на счетах"
            value={k.pointsInCirculation.toLocaleString("ru-RU")}
            sub="сумма по всем"
            borderLeft
          />
        </div>
      </Wrap>
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  borderLeft,
}: {
  label: string;
  value: string;
  sub?: string;
  borderLeft?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-1.5 p-6 " + (borderLeft ? "md:border-l md:border-ink" : "")
      }
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="font-display text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
      </span>
      {sub ? (
        <span className="font-mono text-[12px] text-graphite">{sub}</span>
      ) : null}
    </div>
  );
}

function StravaFlowStrip({ summary }: { summary: DashboardSummary }) {
  const s = summary.stravaFlow;
  return (
    <section className="border-b border-ink">
      <Wrap className="py-0">
        <div className="grid grid-cols-1 gap-0 border border-ink md:grid-cols-3">
          <FlowCell
            label="Пробежек загружено за неделю"
            value={s.ingested7d.toString()}
            sub="из Strava"
          />
          <FlowCell
            label="Засчитано за неделю"
            value={(s.attendances7dAuto + s.attendances7dManual).toString()}
            sub={`${s.attendances7dAuto} автоматически · ${s.attendances7dManual} вручную`}
            borderLeft
          />
          <FlowCell
            label="Сколько пробежек привязалось к событиям"
            value={s.matchRate7dPct == null ? "—" : `${s.matchRate7dPct}%`}
            sub={
              s.matchRate7dPct == null
                ? "нет данных за период"
                : s.matchRate7dPct < 50
                  ? "низкий показатель — открой диагностику"
                  : "нормально"
            }
            borderLeft
            warn={s.matchRate7dPct != null && s.matchRate7dPct < 50}
          />
        </div>
      </Wrap>
    </section>
  );
}

function FlowCell({
  label,
  value,
  sub,
  borderLeft,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  borderLeft?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-1.5 p-6 " +
        (borderLeft ? "md:border-l md:border-ink " : "") +
        (warn ? "bg-brand-tint/15" : "")
      }
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="font-display text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
      </span>
      {sub ? (
        <span
          className={
            "font-mono text-[12px] " +
            (warn ? "text-brand-red-ink" : "text-graphite")
          }
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

function EventsStrip({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-0">
        <div className="grid grid-cols-1 gap-0 border border-ink md:grid-cols-2">
          <EventBlock title="Ближайшее событие" event={summary.events.next} kind="next" />
          <EventBlock
            title="Последнее прошедшее"
            event={summary.events.lastPast}
            kind="past"
            borderLeft
          />
        </div>
      </Wrap>
    </section>
  );
}

function EventBlock({
  title,
  event,
  kind,
  borderLeft,
}: {
  title: string;
  event: SummaryEvent | null;
  kind: "next" | "past";
  borderLeft?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-3 p-6 md:p-8 " +
        (borderLeft ? "md:border-l md:border-ink" : "")
      }
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {title}
      </span>
      {event == null ? (
        <span className="font-sans text-[15px] text-graphite">
          {kind === "next"
            ? "Нет запланированных в ближайшие 14 дней."
            : "Нет проведённых событий."}
        </span>
      ) : (
        <>
          <h3 className="type-h3">{event.title}</h3>
          <span className="font-mono text-[13px] tracking-[0.04em] text-ink">
            {fmtDateTime(event.startsAt)} · {eventTypeRu(event.type)}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[13px]">
            <span className="text-brand-red">{event.goingCount} собираются</span>
            <span className="text-ink">{event.attendedCount} пришли</span>
          </div>
          <Link
            href={`/events/${encodeURIComponent(event.id)}`}
            className="mt-auto font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
          >
            Открыть событие →
          </Link>
        </>
      )}
    </div>
  );
}

function eventTypeRu(type: string): string {
  if (type === "regular") return "среда";
  if (type === "special") return "спецзабег";
  if (type === "partner") return "партнёрское";
  return type;
}

function ErrorState({ status, message }: { status: number; message: string }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-12">
        <div className="border border-brand-red bg-brand-tint/30 p-8">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red-ink">
            не удалось загрузить сводку
          </span>
          <h2 className="type-h2 mt-3">
            {status === 401
              ? "Сессия не подходит"
              : status === 403
                ? "Нет прав admin"
                : status >= 500
                  ? "Ошибка на сервере"
                  : "Сводка недоступна"}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] text-graphite">
            {status === 401
              ? "Войди заново через /auth — куки с токеном устарели или их нет."
              : status === 403
                ? "У этого пользователя нет роли admin. Зайди под админским аккаунтом."
                : status >= 500
                  ? "API упал на агрегации. Полный стек — в Sentry. Подсказка по ошибке ниже."
                  : "Проверь, что API доступен, и попробуй обновить страницу."}
          </p>
          <p className="mt-4 font-mono text-[12px] text-ink">
            <span className="text-muted">код: </span>
            {status || "0"}
            <span className="ml-3 text-muted">сообщение: </span>
            {message}
          </p>
        </div>
      </Wrap>
    </section>
  );
}
