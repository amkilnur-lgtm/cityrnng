import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { listAdminRecurrenceRules } from "@/lib/api-admin";

export const metadata = { title: "Расписание · Admin · CITYRNNG" };

const DAY_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

export default async function AdminRecurrencePage() {
  const rules = await listAdminRecurrenceRules();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">расписание</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {rules.length}{" "}
              <em className="not-italic text-brand-red">
                {rules.length === 1
                  ? "правило"
                  : rules.length < 5
                    ? "правила"
                    : "правил"}
              </em>
            </h1>
          </div>
          <Link
            href="/admin/recurrence/new"
            className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            + Новое правило
          </Link>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {rules.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пока пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Правил расписания нет. Заведи правило «среда 19:30 — все
                3 точки» — и сайт сразу начнёт показывать ближайшую среду
                на главной и в&nbsp;/events.
              </p>
            </div>
          ) : (
            <div className="border border-ink">
              <table className="w-full text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Когда</Th>
                    <Th>Название</Th>
                    <Th>Точки</Th>
                    <Th>Длит / Баллы</Th>
                    <Th>Тип / Статус</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={
                        "transition-colors hover:bg-paper-2 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <Td mono>
                        {DAY_SHORT[r.dayOfWeek]} · {r.timeOfDay}
                      </Td>
                      <Td>
                        <span className="font-medium text-ink">{r.title}</span>
                      </Td>
                      <Td>
                        <ul className="flex flex-wrap gap-1">
                          {r.locations.map((rl) => (
                            <li
                              key={rl.locationId}
                              className="inline-flex h-6 items-center border border-ink/30 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                            >
                              {rl.location.slug}
                            </li>
                          ))}
                        </ul>
                      </Td>
                      <Td mono className="text-[12px] text-muted">
                        {r.durationMinutes}мин · +{r.basePointsAward}Б
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                            {r.type}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/recurrence/${r.id}`}
                          className="font-sans text-[13px] font-medium text-ink hover:text-brand-red"
                        >
                          Изменить →
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Wrap>
      </section>
    </main>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
  className,
}: {
  children?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={
        "px-4 py-3 align-top " +
        (mono ? "font-mono text-[13px] tracking-[0.04em] " : "") +
        (className ?? "")
      }
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "border-ink bg-paper text-ink"
      : "border-muted-2 bg-paper-2 text-muted-2";
  return (
    <span
      className={
        "inline-flex h-6 items-center border px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] " +
        cls
      }
    >
      {status}
    </span>
  );
}
