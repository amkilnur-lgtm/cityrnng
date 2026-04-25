import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { listAdminPartners } from "@/lib/api-admin";

export const metadata = { title: "Партнёры · Admin · CITYRNNG" };

export default async function AdminPartnersPage() {
  const partners = await listAdminPartners();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">партнёры</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {partners.length}{" "}
              <em className="not-italic text-brand-red">
                {partners.length === 1
                  ? "партнёр"
                  : partners.length < 5
                    ? "партнёра"
                    : "партнёров"}
              </em>
            </h1>
          </div>
          <Link
            href="/admin/partners/new"
            className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            + Новый партнёр
          </Link>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {partners.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пока пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Партнёров ещё нет. Создай первого через кнопку выше — после
                этого можно будет добавлять награды.
              </p>
            </div>
          ) : (
            <div className="border border-ink">
              <table className="w-full text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Slug</Th>
                    <Th>Название</Th>
                    <Th>Email</Th>
                    <Th>Статус</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={
                        "transition-colors hover:bg-paper-2 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <Td mono>{p.slug}</Td>
                      <Td>
                        <span className="font-medium text-ink">{p.name}</span>
                      </Td>
                      <Td className="text-[13px] text-muted">
                        {p.contactEmail ?? "—"}
                      </Td>
                      <Td>
                        <StatusBadge status={p.status} />
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/partners/${p.id}`}
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
