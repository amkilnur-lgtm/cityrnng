import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { listAdminRewards } from "@/lib/api-admin";

export const metadata = { title: "Награды · Admin · CITYRNNG" };

export default async function AdminRewardsPage() {
  const rewards = await listAdminRewards();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">награды</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {rewards.length}{" "}
              <em className="not-italic text-brand-red">
                {rewards.length === 1
                  ? "награда"
                  : rewards.length < 5
                    ? "награды"
                    : "наград"}
              </em>
            </h1>
          </div>
          <Link
            href="/admin/rewards/new"
            className="inline-flex h-12 items-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
          >
            + Новая награда
          </Link>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {rewards.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пока пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Наград нет. Сначала заведи партнёра, потом добавь к&nbsp;нему
                награды (кофе, выпечка, абонементы).
              </p>
            </div>
          ) : (
            <div className="border border-ink">
              <table className="w-full text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Партнёр</Th>
                    <Th>Slug</Th>
                    <Th>Название</Th>
                    <Th>Цена</Th>
                    <Th>Капасити</Th>
                    <Th>Статус</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={
                        "transition-colors hover:bg-paper-2 " +
                        (idx > 0 ? "border-t border-ink/15" : "")
                      }
                    >
                      <Td>
                        <span className="text-[13px] text-muted">
                          {r.partner.name}
                        </span>
                      </Td>
                      <Td mono>{r.slug}</Td>
                      <Td>
                        <span className="font-medium text-ink">{r.title}</span>
                        {r.badge ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-red">
                            {r.badge}
                          </span>
                        ) : null}
                      </Td>
                      <Td mono className="text-brand-red">
                        {r.costPoints}&nbsp;Б
                      </Td>
                      <Td mono className="text-[12px] text-muted">
                        {r.capacity
                          ? `${r.soldCount}/${r.capacity}`
                          : `${r.soldCount} / ∞`}
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/rewards/${r.id}`}
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
