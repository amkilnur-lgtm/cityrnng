import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import {
  getDashboardSummary,
  type DashboardSummary,
  type SummaryEvent,
} from "@/lib/api-admin-strava";

export const metadata = { title: "Сводка · Админка · CITYRNNG" };

// Server-side revalidation: page rebuilds at most once per minute when
// re-requested. Keeps numbers fresh without hammering Prisma + Strava API
// on every navigation.
export const revalidate = 60;

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

function fmtNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

// Russian plural for "X пришёл / 2 пришли / 5 пришли" patterns.
// 1, 21, 31 → singular; 2-4, 22-24 → genitive plural form; rest → nominative plural.
// We use a simpler binary here: 1 → first form, anything else → second form.
function pluralRu(n: number, one: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  return mod10 === 1 ? one : many;
}

// ── Status semantics ────────────────────────────────────────────────────
// Operating-console status: each cell of the health-bar is either OK
// (no action needed) or WARN (admin should look). We intentionally do
// not introduce green — brand is red on monochrome, and a third hue
// would dilute the design language. Instead OK is neutral (ink) and
// WARN is brand-red. Color is paired with an icon + text label per
// the "don't convey by color alone" rule.

type Status = "ok" | "warn";

interface HealthSignal {
  status: Status;
  label: string;       // section title — "Уведомления Strava"
  primary: string;     // current state — "подписка активна"
  hint?: string;       // small grey detail — "в памяти 3 пробежки"
  cta?: { href: string; text: string };
}

function computeHealth(summary: DashboardSummary): {
  cells: HealthSignal[];
  warnCount: number;
} {
  const ws = summary.health.webhookSubscription;
  const webhookOk = ws.active && ws.callbackMatches;
  const webhookCell: HealthSignal = {
    status: webhookOk ? "ok" : "warn",
    label: "Уведомления Strava",
    primary: ws.active
      ? ws.callbackMatches
        ? `подписка №${ws.subscriptionId} активна`
        : `подписка №${ws.subscriptionId} — адрес устарел`
      : "подписка не зарегистрирована",
    hint: webhookOk ? undefined : "Strava не сможет слать новые пробежки",
    cta: { href: "/admin/strava/webhook", text: "Управление" },
  };

  const ingestStale = summary.health.lastIngestAt
    ? Date.now() - new Date(summary.health.lastIngestAt).getTime() > 24 * 3600 * 1000 &&
      summary.kpis.stravaConnected > 0
    : summary.kpis.stravaConnected > 0;
  const ingestCell: HealthSignal = {
    status: ingestStale ? "warn" : "ok",
    label: "Получение пробежек",
    primary: summary.health.lastIngestAt
      ? `последняя ${fmtRelative(summary.health.lastIngestAt)}`
      : "пока ничего не приходило",
    hint: `в памяти ${summary.health.cachedActivities} ${pluralRu(summary.health.cachedActivities, "пробежка", "пробежек")}`,
  };

  const serverCell: HealthSignal = {
    status: "ok",
    label: "Сервер",
    primary: "работает",
    hint: "детальная статистика — в Sentry",
  };

  const cells = [webhookCell, ingestCell, serverCell];
  return { cells, warnCount: cells.filter((c) => c.status === "warn").length };
}

// ── Page ────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const result = await getDashboardSummary();
  const renderedAt = new Date().toISOString();

  return (
    <main>
      {result.ok ? (
        <DashboardContent summary={result.data} renderedAt={renderedAt} />
      ) : (
        <ErrorState status={result.status} message={result.message} />
      )}
    </main>
  );
}

function DashboardContent({
  summary,
  renderedAt,
}: {
  summary: DashboardSummary;
  renderedAt: string;
}) {
  const { cells: healthCells, warnCount } = computeHealth(summary);

  return (
    <>
      <StatusBanner warnCount={warnCount} renderedAt={renderedAt} />
      <HealthSection cells={healthCells} />
      <StravaFlowSection summary={summary} />
      <KpiSection summary={summary} />
      <EventsSection summary={summary} />
    </>
  );
}

// ── Top: status banner with overall summary + refresh timestamp ─────────

function StatusBanner({ warnCount, renderedAt }: { warnCount: number; renderedAt: string }) {
  const allOk = warnCount === 0;
  return (
    <section className={"border-b border-ink " + (allOk ? "bg-paper-2/40" : "bg-brand-tint/30")}>
      <Wrap className="py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">админка · сводка</span>
            <div className="flex items-center gap-3">
              <StatusIcon status={allOk ? "ok" : "warn"} />
              <h1 className="font-display text-[36px] font-bold leading-none tracking-[-0.025em] text-ink md:text-[44px]">
                {allOk
                  ? "Всё работает."
                  : `Требует внимания: ${warnCount}.`}
              </h1>
            </div>
            <p className="type-lede max-w-2xl text-[15px]">
              Что сейчас происходит в проекте. Разделы — слева в меню.
            </p>
          </div>
          <div className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted lg:text-right">
            <span>обновлено {fmtRelative(renderedAt)}</span>
            <span className="text-muted/70">обновляется автоматически раз в минуту</span>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

// ── Health bar ──────────────────────────────────────────────────────────

function HealthSection({ cells }: { cells: HealthSignal[] }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-8">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          состояние систем
        </h2>
        <div className="mt-4 grid grid-cols-1 border-y-2 border-ink md:grid-cols-3">
          {cells.map((cell, i) => (
            <HealthCell
              key={cell.label}
              cell={cell}
              borderLeft={i > 0}
            />
          ))}
        </div>
      </Wrap>
    </section>
  );
}

function HealthCell({
  cell,
  borderLeft,
}: {
  cell: HealthSignal;
  borderLeft?: boolean;
}) {
  const warn = cell.status === "warn";
  return (
    <div
      className={
        "flex flex-col gap-2.5 bg-paper p-5 " +
        (borderLeft ? "md:border-l md:border-ink/40 " : "")
      }
    >
      <div className="flex items-center gap-2">
        <StatusIcon status={cell.status} />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {cell.label}
        </span>
      </div>
      <span
        className={
          "font-sans text-[15px] font-semibold leading-snug " +
          (warn ? "text-brand-red-ink" : "text-ink")
        }
      >
        {cell.primary}
      </span>
      {cell.hint ? (
        <span className="font-mono text-[12px] text-graphite">{cell.hint}</span>
      ) : null}
      {cell.cta ? (
        <Link
          href={cell.cta.href}
          className="mt-auto inline-flex w-fit items-center gap-1 font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
        >
          {cell.cta.text}
          <ArrowRight />
        </Link>
      ) : null}
    </div>
  );
}

// ── Strava flow (hero: засчитано) ───────────────────────────────────────
// Match-rate (% подтянутых, что попали в события) — это developer-метрика,
// а не оператора. У клуба пользователи бегают в течение недели много где —
// большинство активностей НЕ попадёт в окно среды, и это нормально. Поэтому
// hero — абсолютное число «засчитано», а match-rate показываем мелко как
// справочное; алярмить им не алярмим.

function StravaFlowSection({ summary }: { summary: DashboardSummary }) {
  const s = summary.stravaFlow;
  const credited = s.attendances7dAuto + s.attendances7dManual;
  const noData = s.ingested7d === 0;

  return (
    <section className="border-b border-ink">
      <Wrap className="py-10">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          поток Strava · за неделю
        </h2>

        {noData ? (
          <EmptyBlock
            title="За неделю пробежки не приходили"
            body="Это нормально, если никто из подключённых к Strava не выходил бегать. Если ждёшь чьи-то — проверь подписку на уведомления."
            ctaHref="/admin/strava/webhook"
            ctaText="Проверить подписку"
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 border-y-2 border-ink lg:grid-cols-[1.4fr_1fr]">
            {/* Hero — absolute count of credited runs */}
            <div className="flex flex-col gap-4 bg-paper p-6 md:p-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  засчитано на наших событиях
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-display text-[72px] font-bold leading-none tracking-[-0.03em] text-ink">
                  {fmtNumber(credited)}
                </span>
                <span className="font-sans text-[18px] text-graphite">
                  {pluralRu(credited, "пробежка", "пробежек")}
                </span>
              </div>
              <p className="max-w-md text-[14px] leading-snug text-graphite">
                Это пробежки, которые попали в окно события и засчитались в
                баллы. Strava подтягивает все активности подряд — мимо событий
                их в норме большинство, низкая доля попадания — не сбой.
              </p>
              <Link
                href="/admin/strava/debug"
                className="inline-flex w-fit items-center gap-2 border border-ink bg-paper px-4 py-2.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Посмотреть диагностику
                <ArrowRight />
              </Link>
            </div>

            {/* Supporting metrics */}
            <div className="grid grid-cols-1 border-t border-ink md:grid-cols-2 lg:border-l lg:border-ink/40 lg:border-t-0 lg:grid-cols-1">
              <SupportCell
                label="Подтянули из Strava"
                value={fmtNumber(s.ingested7d)}
                hint={pluralRu(s.ingested7d, "активность", "активностей") + " за период"}
              />
              <SupportCell
                label="Попали в события"
                value={s.matchRate7dPct == null ? "—" : `${s.matchRate7dPct}%`}
                hint={`${s.attendances7dAuto} из ${s.ingested7d} активностей`}
                borderTop
              />
            </div>
          </div>
        )}
      </Wrap>
    </section>
  );
}

function SupportCell({
  label,
  value,
  hint,
  borderTop,
}: {
  label: string;
  value: string;
  hint?: string;
  borderTop?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-1.5 bg-paper p-5 " +
        (borderTop
          ? "border-t border-ink/40 md:border-l md:border-ink/40 md:border-t-0 lg:border-t lg:border-l-0"
          : "")
      }
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="font-display text-[28px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
      </span>
      {hint ? (
        <span className="font-mono text-[12px] text-graphite">{hint}</span>
      ) : null}
    </div>
  );
}

// ── KPI strip ───────────────────────────────────────────────────────────

function KpiSection({ summary }: { summary: DashboardSummary }) {
  const k = summary.kpis;
  const stravaPct = k.totalUsers > 0 ? Math.round((k.stravaConnected / k.totalUsers) * 100) : 0;
  return (
    <section className="border-b border-ink bg-paper-2/30">
      <Wrap className="py-10">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          ключевые цифры
        </h2>
        <div className="mt-4 grid grid-cols-1 border-y-2 border-ink md:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Пользователей"
            value={fmtNumber(k.totalUsers)}
            sub={k.newUsers7d > 0 ? `+${k.newUsers7d} за неделю` : undefined}
          />
          <Kpi
            label="Подключено к Strava"
            value={fmtNumber(k.stravaConnected)}
            sub={k.totalUsers > 0 ? `${stravaPct}% от всех` : undefined}
            borderLeft
          />
          <Kpi
            label="Активных бегунов за неделю"
            value={fmtNumber(k.activeRunners7d)}
            sub="с засчитанной пробежкой"
            borderLeft
          />
          <Kpi
            label="Баллов на счетах"
            value={fmtNumber(k.pointsInCirculation)}
            sub="сумма по всем"
            unit="Б"
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
  unit,
  borderLeft,
}: {
  label: string;
  value: string;
  sub?: string;
  unit?: string;
  borderLeft?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-1.5 bg-paper p-6 " +
        (borderLeft
          ? "lg:border-l lg:border-ink/40 md:border-l md:border-ink/40 md:[&:nth-child(2n+1)]:border-l-0 lg:[&:nth-child(2n+1)]:border-l"
          : "")
      }
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-[34px] font-bold leading-none tracking-[-0.03em] text-ink">
          {value}
        </span>
        {unit ? (
          <span className="font-mono text-[14px] font-medium text-graphite">
            {unit}
          </span>
        ) : null}
      </span>
      {sub ? (
        <span className="font-mono text-[12px] text-graphite">{sub}</span>
      ) : null}
    </div>
  );
}

// ── Events ──────────────────────────────────────────────────────────────

function EventsSection({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-10">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          события
        </h2>
        <div className="mt-4 grid grid-cols-1 border-y-2 border-ink md:grid-cols-2">
          <EventCard title="Ближайшее" kind="next" event={summary.events.next} />
          <EventCard title="Последнее прошедшее" kind="past" event={summary.events.lastPast} borderLeft />
        </div>
      </Wrap>
    </section>
  );
}

function EventCard({
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
        "flex flex-col gap-3 bg-paper p-6 md:p-8 " +
        (borderLeft ? "md:border-l md:border-ink/40" : "")
      }
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {title}
      </span>
      {event == null ? (
        <span className="text-[14px] text-graphite">
          {kind === "next"
            ? "В ближайшие две недели событий не запланировано."
            : "Проведённых событий пока не было."}
        </span>
      ) : (
        <>
          <h3 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">
            {event.title}
          </h3>
          <span className="font-mono text-[13px] tracking-[0.04em] text-ink">
            {fmtDateTime(event.startsAt)} · {eventTypeRu(event.type)}
          </span>
          {kind === "next" ? (
            <NextEventStats event={event} />
          ) : (
            <PastEventStats event={event} />
          )}
          <Link
            href={`/events/${encodeURIComponent(event.id)}`}
            className="mt-auto inline-flex w-fit items-center gap-1 font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
          >
            Открыть событие
            <ArrowRight />
          </Link>
        </>
      )}
    </div>
  );
}

function NextEventStats({ event }: { event: SummaryEvent }) {
  if (event.goingCount === 0) {
    return (
      <span className="font-sans text-[13px] text-graphite">
        Пока никто не записался.
      </span>
    );
  }
  return (
    <span className="font-mono text-[13px] tracking-[0.04em] text-brand-red">
      {fmtNumber(event.goingCount)} {pluralRu(event.goingCount, "собирается", "собираются")}
    </span>
  );
}

function PastEventStats({ event }: { event: SummaryEvent }) {
  if (event.attendedCount === 0) {
    return (
      <span className="font-sans text-[13px] text-graphite">
        Никто не пришёл — пробежки не были засчитаны.
      </span>
    );
  }
  return (
    <span className="font-mono text-[13px] tracking-[0.04em] text-ink">
      {fmtNumber(event.attendedCount)} {pluralRu(event.attendedCount, "пришёл", "пришли")}
    </span>
  );
}

function eventTypeRu(type: string): string {
  if (type === "regular") return "среда";
  if (type === "special") return "спецзабег";
  if (type === "partner") return "партнёрское";
  return type;
}

// ── Shared building blocks ──────────────────────────────────────────────

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") {
    return (
      <span
        role="img"
        aria-label="всё в порядке"
        className="inline-flex h-5 w-5 items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.5 12.5 L10.5 15.5 L16.5 8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label="требует внимания"
      className="inline-flex h-5 w-5 items-center justify-center"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-red" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path
          d="M12 7 L12 13"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16.5" r="1.1" fill="white" />
      </svg>
    </span>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        d="M5 12 L19 12 M14 7 L19 12 L14 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyBlock({
  title,
  body,
  ctaHref,
  ctaText,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaText?: string;
}) {
  return (
    <div className="mt-4 flex flex-col items-start gap-3 border border-ink bg-paper-2/40 p-6 md:p-8">
      <h3 className="font-display text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <p className="max-w-2xl text-[14px] leading-snug text-graphite">{body}</p>
      {ctaHref && ctaText ? (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
        >
          {ctaText}
          <ArrowRight />
        </Link>
      ) : null}
    </div>
  );
}

function ErrorState({ status, message }: { status: number; message: string }) {
  return (
    <section className="border-b border-ink bg-brand-tint/30">
      <Wrap className="py-12">
        <div className="flex flex-col gap-4 border border-brand-red bg-paper p-8">
          <div className="flex items-center gap-2">
            <StatusIcon status="warn" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red-ink">
              не удалось загрузить сводку
            </span>
          </div>
          <h2 className="font-display text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink">
            {status === 401
              ? "Сессия не подходит"
              : status === 403
                ? "Нет прав admin"
                : status >= 500
                  ? "Ошибка на сервере"
                  : "Сводка недоступна"}
          </h2>
          <p className="max-w-2xl text-[14px] text-graphite">
            {status === 401
              ? "Войди заново через /auth — куки с токеном устарели или их нет."
              : status === 403
                ? "У этого пользователя нет роли admin. Зайди под админским аккаунтом."
                : status >= 500
                  ? "Сервер упал на сборке сводки. Полный стек — в Sentry."
                  : "Проверь, что API доступен, и попробуй обновить страницу."}
          </p>
          <p className="mt-2 font-mono text-[12px] text-ink">
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
