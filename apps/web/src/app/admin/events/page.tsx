import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { listAdminEvents } from "@/lib/api-admin";

export const metadata = { title: "События · Admin · CITYRNNG" };

const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function AdminEventsPage() {
  const events = await listAdminEvents();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">явные события</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {events.length}{" "}
              <em className="not-italic text-brand-red">
                {events.length === 1
                  ? "событие"
                  : events.length < 5
                    ? "события"
                    : "событий"}
              </em>
            </h1>
            <p className="type-lede max-w-2xl">
              Только явные DB-записи. Регулярные среды, материализованные
              из&nbsp;recurrence-rules, здесь не&nbsp;показываются — они
              существуют только в&nbsp;памяти при выдаче на&nbsp;
              <code className="font-mono text-[14px] text-ink">
                /events/upcoming
              </code>
              .
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex h-11 items-center self-start border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            + Создать событие
          </Link>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {events.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пока пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Явных событий нет. Регулярные среды видны на сайте через
                recurrence-rules — добавь правило в&nbsp;разделе
                «Расписание». Для one-off спецсобытий — кнопка «Создать» выше.
              </p>
            </div>
          ) : (
            <div className="border border-ink">
              <table className="w-full text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Когда</Th>
                    <Th>Название</Th>
                    <Th>Тип</Th>
                    <Th>Статус</Th>
                    <Th>Override</Th>
                    <Th>Баллы</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, idx) => (
                    <tr
                      key={e.id}
                      className={
                        "transition-colors hover:bg-paper-2 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <Td mono>{fmt(e.startsAt)}</Td>
                      <Td>
                        <span className="font-medium text-ink">{e.title}</span>
                        <div className="font-mono text-[11px] text-muted">
                          {e.slug}
                        </div>
                      </Td>
                      <Td>
                        <Badge>{e.type}</Badge>
                      </Td>
                      <Td>
                        <Badge variant={e.status === "published" ? "active" : "muted"}>
                          {e.status}
                        </Badge>
                      </Td>
                      <Td className="text-[12px]">
                        {e.recurrenceRuleId ? (
                          <span className="font-mono text-brand-red">
                            override
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Td>
                      <Td mono>
                        {e.isPointsEligible
                          ? `+${e.basePointsAward} Б`
                          : "—"}
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/events/${e.id}`}
                          className="font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
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

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "active" | "muted";
}) {
  const cls =
    variant === "muted"
      ? "border-muted-2 bg-paper-2 text-muted"
      : "border-ink bg-paper text-ink";
  return (
    <span
      className={
        "inline-flex h-6 items-center border px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] " +
        cls
      }
    >
      {children}
    </span>
  );
}
