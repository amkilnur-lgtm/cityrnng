import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { listAdminLocations } from "@/lib/api-admin";

export const metadata = { title: "Локации · Admin · CITYRNNG" };

export default async function AdminLocationsPage() {
  const locations = await listAdminLocations();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">локации</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {locations.length}{" "}
              <em className="not-italic text-brand-red">
                {locations.length === 1
                  ? "локация"
                  : locations.length < 5
                    ? "локации"
                    : "локаций"}
              </em>
            </h1>
          </div>
          <Link
            href="/admin/locations/new"
            className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            + Новая локация
          </Link>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {locations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto border border-ink">
              <table className="w-full min-w-[720px] text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Slug</Th>
                    <Th>Название</Th>
                    <Th>Город</Th>
                    <Th>Координаты</Th>
                    <Th>Радиус</Th>
                    <Th>Статус</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, idx) => (
                    <tr
                      key={loc.id}
                      className={
                        "transition-colors hover:bg-paper-2 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <Td mono>{loc.slug}</Td>
                      <Td>
                        <span className="font-medium text-ink">{loc.name}</span>
                      </Td>
                      <Td>{loc.city}</Td>
                      <Td mono className="text-[12px] text-muted">
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </Td>
                      <Td mono>
                        {loc.radiusMeters ? `${loc.radiusMeters} м` : "—"}
                      </Td>
                      <Td>
                        <StatusBadge status={loc.status} />
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/locations/${loc.id}`}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
      <span className="type-mono-caps">пока пусто</span>
      <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
        Локации пока не созданы — либо API недоступен, либо ты в&nbsp;
        <code className="font-mono text-[13px] text-ink">dev mock</code>
        -сессии без токена. Реальный список появится когда залогинишься
        через magic-link с&nbsp;ролью admin.
      </p>
      <Link
        href="/admin/locations/new"
        className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
      >
        + Создать локацию
      </Link>
    </div>
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
      : "border-muted-2 bg-paper-2 text-muted";
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
