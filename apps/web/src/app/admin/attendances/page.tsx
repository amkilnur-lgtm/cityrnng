import Link from "next/link";
import { AttendanceActions } from "@/components/admin/attendance-actions";
import { Wrap } from "@/components/site/wrap";
import { listAdminAttendances } from "@/lib/api-admin";

export const metadata = { title: "Attendances · Admin · CITYRNNG" };

const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function AdminAttendancesPage({
  searchParams,
}: {
  searchParams: { status?: "pending" | "approved" | "rejected" };
}) {
  const status = searchParams.status ?? "pending";
  const attendances = await listAdminAttendances({ status });

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">attendances · {status}</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {attendances.length}{" "}
              <em className="not-italic text-brand-red">
                {attendances.length === 1
                  ? "запись"
                  : attendances.length < 5
                    ? "записи"
                    : "записей"}
              </em>
            </h1>
          </div>
          <nav className="flex border border-ink bg-paper">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <Link
                key={s}
                href={`/admin/attendances?status=${s}`}
                className={
                  "px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-[0.14em] " +
                  (status === s
                    ? "bg-ink text-paper"
                    : "text-muted hover:text-ink")
                }
              >
                {s}
              </Link>
            ))}
          </nav>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {attendances.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Записей со статусом <b>{status}</b> нет. Strava-матчер
                создаёт <code className="font-mono text-[13px]">pending</code>
                записи автоматом, либо админ заводит вручную.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-ink">
              <table className="w-full min-w-[820px] text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Когда</Th>
                    <Th>Юзер</Th>
                    <Th>Событие</Th>
                    <Th>Source</Th>
                    {status === "pending" ? <Th /> : <Th>Reviewed</Th>}
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={
                        "transition-colors hover:bg-paper-2 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <Td mono>{fmt(a.createdAt)}</Td>
                      <Td>
                        <div className="text-[13px] text-ink">{a.user.email}</div>
                        <div className="font-mono text-[11px] text-muted">
                          {a.user.id.slice(0, 8)}…
                        </div>
                      </Td>
                      <Td>
                        <div className="font-medium text-ink">
                          {a.event.title}
                        </div>
                        <div className="font-mono text-[11px] text-muted">
                          {fmt(a.event.startsAt)} · {a.event.type}
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex h-6 items-center border border-ink/30 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          {a.source}
                        </span>
                      </Td>
                      <Td className="text-right">
                        {status === "pending" ? (
                          <AttendanceActions id={a.id} />
                        ) : (
                          <div className="text-[12px] text-muted">
                            {a.reviewedAt ? fmt(a.reviewedAt) : "—"}
                            {a.rejectionReason ? (
                              <div className="text-brand-red-ink">
                                {a.rejectionReason}
                              </div>
                            ) : null}
                          </div>
                        )}
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
