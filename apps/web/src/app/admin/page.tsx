import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import {
  getDashboardSummary,
  type DashboardSummary,
  type SummaryEvent,
} from "@/lib/api-admin-dashboard";

export const metadata = { title: "Сводка · Админка · CITYRNNG" };

// Server-side revalidation: page rebuilds at most once per minute when
// re-requested. Keeps numbers fresh without hammering Prisma on every
// navigation.
export const revalidate = 60;

const RU_MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

const RU_WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${RU_WEEKDAYS_SHORT[d.getDay()]} · ${d.getDate()} ${RU_MONTHS_SHORT[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

function fmtClock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
  label: string;       // section title — "Сканеры на точках"
  primary: string;     // current state — "2 активных из 3"
  hint?: string;       // small grey detail — "на связи за неделю: 2"
  cta?: { href: string; text: string };
}

function computeHealth(summary: DashboardSummary): {
  cells: HealthSignal[];
  warnCount: number;
} {
  const sc = summary.health.scanners;
  // Без единого активного сканера QR-отметка не работает — это и есть
  // главный сигнал поломки новой механики.
  const scannersOk = sc.active > 0;
  const scannerCell: HealthSignal = {
    status: scannersOk ? "ok" : "warn",
    label: "Сканеры на точках",
    primary:
      sc.total === 0
        ? "ни одного сканера не заведено"
        : sc.active === 0
          ? "все сканеры выключены"
          : `${fmtNumber(sc.active)} ${pluralRu(sc.active, "активный", "активных")} из ${fmtNumber(sc.total)}`,
    hint: scannersOk
      ? sc.lastSeenAt
        ? `на связи: ${fmtRelative(sc.lastSeenAt)}`
        : "ещё ни разу не выходили на связь"
      : "без сканера QR-отметка на точке не работает",
    cta: { href: "/admin/checkin", text: "Управление" },
  };

  // Информационная ячейка: «когда был последний скан». Не алярмим на
  // staleness — пробежки раз в неделю, тишина между средами это норма.
  // Реальный сигнал о поломке — ячейка сканеров (выше).
  const scanCell: HealthSignal = {
    status: "ok",
    label: "Последний скан",
    primary: summary.health.lastScanAt
      ? `был ${fmtRelative(summary.health.lastScanAt)}`
      : "сканов пока не было",
    hint:
      summary.health.totalScans > 0
        ? `в журнале ${fmtNumber(summary.health.totalScans)} ${pluralRu(summary.health.totalScans, "скан", "сканов")}`
        : undefined,
  };

  const cells = [scannerCell, scanCell];
  return { cells, warnCount: cells.filter((c) => c.status === "warn").length };
}

// ── Page ────────────────────────────────────────────────────────────────

// Mock summary used in dev-mock admin sessions (no real API token) so the
// dashboard renders with realistic numbers for design work and demos
// without requiring access to staging. In a real admin session the live
// summary always wins.
const DEV_MOCK_SUMMARY: DashboardSummary = {
  health: {
    scanners: {
      total: 3,
      active: 2,
      seen7d: 2,
      lastSeenAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    lastScanAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    totalScans: 27,
  },
  kpis: {
    totalUsers: 4,
    newUsers7d: 1,
    withCheckinCode: 4,
    activeRunners7d: 1,
    pointsInCirculation: 180,
  },
  checkinFlow: {
    scans7d: 9,
    matched7d: 6,
    duplicates7d: 1,
    noWindow7d: 1,
    unknownCode7d: 1,
    errors7d: 0,
    attendances7dQr: 6,
    attendances7dManual: 1,
  },
  events: {
    next: {
      id: "rule:0000-0000-0000:2026-06-03",
      title: "Пробежка Ситираннинг",
      type: "regular",
      startsAt: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
      goingCount: 0,
      attendedCount: 0,
    },
    lastPast: {
      id: "rule:0000-0000-0000:2026-05-20",
      title: "Пробежка Ситираннинг",
      type: "regular",
      startsAt: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        d.setHours(19, 30, 0, 0);
        return d.toISOString();
      })(),
      goingCount: 0,
      attendedCount: 1,
    },
  },
};

export default async function AdminDashboardPage() {
  const result = await getDashboardSummary();
  const renderedAt = new Date().toISOString();

  // Real admin session → live data. Dev-mock admin (no API token) → sample
  // numbers so designers can iterate locally. Production failures fall
  // through to ErrorState — never show fake numbers to a real admin.
  const summary: DashboardSummary | null = result.ok
    ? result.data
    : process.env.NODE_ENV !== "production"
      ? DEV_MOCK_SUMMARY
      : null;

  return (
    <main>
      {summary ? (
        <DashboardContent summary={summary} renderedAt={renderedAt} />
      ) : (
        <ErrorState
          status={result.ok ? 0 : result.status}
          message={result.ok ? "" : result.message}
        />
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
      <CheckinFlowSection summary={summary} />
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon status={allOk ? "ok" : "warn"} />
            <h1 className="font-display text-[36px] font-bold leading-none tracking-[-0.025em] text-ink md:text-[44px]">
              {allOk
                ? "Всё работает."
                : `Требует внимания: ${warnCount}.`}
            </h1>
          </div>
          <div className="flex flex-col gap-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted lg:text-right">
            <span>снимок · {fmtClock(renderedAt)}</span>
            <span className="opacity-70">обновляется раз в минуту</span>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

// ── Health bar ──────────────────────────────────────────────────────────

function HealthSection({ cells }: { cells: HealthSignal[] }) {
  return (
    <section>
      <Wrap className="py-8">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          состояние систем
        </h2>
        <div className="mt-4 grid grid-cols-1 border-2 border-ink md:grid-cols-2">
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
        (borderLeft ? "md:border-l md:border-ink " : "")
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
          className="mt-auto inline-flex w-fit items-center gap-2 border border-ink bg-paper px-3 py-1.5 font-sans text-[12px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {cell.cta.text}
          <ArrowRight />
        </Link>
      ) : null}
    </div>
  );
}

// ── QR check-in flow (hero: засчитано) ──────────────────────────────────
// Hero — абсолютное число засчитанных приходов за неделю (QR + ручные).
// Повторные сканы и сканы мимо расписания — справочные, не алярмим: бегун
// может сканировать дважды или прийти не в окно, это штатные исходы.
// Нераспознанные коды и ошибки — сигнал посмотреть журнал.

function CheckinFlowSection({ summary }: { summary: DashboardSummary }) {
  const s = summary.checkinFlow;
  const credited = s.attendances7dQr + s.attendances7dManual;
  const noData = s.scans7d === 0 && credited === 0;
  const suspicious = s.unknownCode7d + s.errors7d;

  return (
    <section>
      <Wrap className="py-8">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          qr-отметки · за неделю
        </h2>

        {noData ? (
          <EmptyBlock
            title="За неделю сканов не было"
            body="Это нормально между пробежками. Если среда прошла, а сканов нет — проверь, что сканер на точке включён и на связи."
            ctaHref="/admin/checkin"
            ctaText="Сканеры и журнал"
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 border-2 border-ink lg:grid-cols-[1.4fr_1fr]">
            {/* Hero — absolute count of credited runs */}
            <div className="flex flex-col gap-4 bg-paper p-6 md:p-8">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                засчитано приходов
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-display text-[72px] font-bold leading-none tracking-[-0.03em] text-ink">
                  {fmtNumber(credited)}
                </span>
                <span className="font-sans text-[15px] font-medium text-graphite">
                  {pluralRu(credited, "пробежка засчитана за неделю", "пробежек засчитано за неделю")}
                  {s.attendances7dManual > 0
                    ? ` · из них вручную: ${fmtNumber(s.attendances7dManual)}`
                    : ""}
                </span>
              </div>
              <p className="max-w-md text-[14px] leading-snug text-graphite">
                Скан на точке → зачёт → баллы. Повторные сканы того же бегуна
                и сканы вне расписания не засчитываются — это штатно, они
                видны в журнале.
              </p>
              <Link
                href="/admin/checkin"
                className="inline-flex w-fit items-center gap-2 border border-ink bg-paper px-4 py-2.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Журнал сканов
                <ArrowRight />
              </Link>
            </div>

            {/* Supporting metrics */}
            <div className="grid grid-cols-1 border-t border-ink md:grid-cols-2 lg:border-l lg:border-ink lg:border-t-0 lg:grid-cols-1">
              <SupportCell
                label="Всего сканов"
                value={fmtNumber(s.scans7d)}
                hint={
                  s.duplicates7d + s.noWindow7d > 0
                    ? `повторы: ${fmtNumber(s.duplicates7d)} · вне расписания: ${fmtNumber(s.noWindow7d)}`
                    : "за период"
                }
              />
              <SupportCell
                label="Не распознано / ошибки"
                value={fmtNumber(suspicious)}
                hint={
                  suspicious > 0
                    ? "чужой код или сбой — глянь журнал"
                    : "всё чисто"
                }
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
          ? "border-t border-ink md:border-l md:border-ink md:border-t-0 lg:border-t lg:border-l-0"
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
  const codePct = k.totalUsers > 0 ? Math.round((k.withCheckinCode / k.totalUsers) * 100) : 0;
  return (
    <section>
      <Wrap className="py-8">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          ключевые цифры
        </h2>
        <div className="mt-4 grid grid-cols-1 border-2 border-ink md:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Пользователей"
            value={fmtNumber(k.totalUsers)}
            sub={k.newUsers7d > 0 ? `+${k.newUsers7d} за неделю` : undefined}
          />
          <Kpi
            label="С QR-кодом"
            value={fmtNumber(k.withCheckinCode)}
            sub={k.withCheckinCode > 0 ? `${codePct}% от всех` : undefined}
            borderLeft
          />
          <Kpi
            label="Активных за неделю"
            value={fmtNumber(k.activeRunners7d)}
            sub={k.activeRunners7d > 0 ? "хотя бы одна пробежка" : undefined}
            borderLeft
          />
          <Kpi
            label="Баллов на счетах"
            value={`${fmtNumber(k.pointsInCirculation)} Б`}
            sub={k.pointsInCirculation > 0 ? "сумма по всем" : undefined}
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
        "flex flex-col gap-1.5 bg-paper p-6 " +
        (borderLeft
          ? "lg:border-l lg:border-ink md:border-l md:border-ink md:[&:nth-child(2n+1)]:border-l-0 lg:[&:nth-child(2n+1)]:border-l"
          : "")
      }
    >
      {/* Лейбл фиксированной высоты — все KPI выравниваются по числу
          независимо от того, влез ли заголовок в одну строку или две. */}
      <span className="min-h-[2.25rem] font-mono text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="font-display text-[34px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
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
    <section>
      <Wrap className="py-8">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          события
        </h2>
        <div className="mt-4 grid grid-cols-1 border-2 border-ink md:grid-cols-2">
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
  // Прошедшее событие визуально приглушаем — фоном и приглушённым текстом
  // даты. Ближайшее остаётся на чистом paper'е, акцент на дате.
  const isPast = kind === "past";
  return (
    <div
      className={
        "flex flex-col gap-3 p-6 md:p-8 " +
        (isPast ? "bg-paper-2/40 " : "bg-paper ") +
        (borderLeft ? "md:border-l md:border-ink" : "")
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
          {/* Дата + тип — primary (отличие между картами «ближайшее»/«прошедшее»
              для повторяющихся еженедельных забегов). Название — secondary. */}
          <h3
            className={
              "font-display text-[28px] font-bold leading-tight tracking-[-0.02em] " +
              (isPast ? "text-graphite" : "text-ink")
            }
          >
            {fmtDateTime(event.startsAt)}
          </h3>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
            {eventTypeRu(event.type)} · {event.title}
          </span>
          {kind === "next" ? (
            <NextEventStats event={event} />
          ) : (
            <PastEventStats event={event} />
          )}
          {isPast ? (
            <Link
              href={`/events/${encodeURIComponent(event.id)}`}
              className="mt-auto inline-flex w-fit items-center gap-1 font-sans text-[13px] font-medium text-graphite transition-colors hover:text-brand-red"
            >
              посмотреть событие →
            </Link>
          ) : (
            <Link
              href={`/events/${encodeURIComponent(event.id)}`}
              className="mt-auto inline-flex w-fit items-center gap-2 border border-ink bg-paper px-4 py-2.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Открыть событие
              <ArrowRight />
            </Link>
          )}
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
        <path
          d="M12 3 L22 20 L2 20 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 9 L12 14"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17" r="1.1" fill="white" />
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
    <div className="mt-4 flex flex-col items-start gap-3 border-2 border-ink bg-paper px-6 py-8 md:px-8">
      <h3 className="font-display text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <p className="max-w-2xl text-[14px] leading-snug text-graphite">{body}</p>
      {ctaHref && ctaText ? (
        <Link
          href={ctaHref}
          className="mt-1 inline-flex items-center gap-2 border border-ink bg-paper px-4 py-2.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
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
