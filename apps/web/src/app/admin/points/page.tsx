import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { PointsAdjustForm } from "@/components/admin/points-adjust-form";
import { listAdminPoints, type AdminPointsTxn } from "@/lib/api-admin";
import { reasonLabel } from "@/lib/api-points-types";

export const metadata = { title: "Балльные операции · Admin · CITYRNNG" };

const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    `${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS[d.getMonth()]} · ` +
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  );
}

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams?: { cursor?: string; userId?: string };
}) {
  const { items, nextCursor } = await listAdminPoints({
    cursor: searchParams?.cursor,
    userId: searchParams?.userId,
    limit: 100,
  });

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col gap-4 py-10">
          <span className="type-mono-caps">балльные операции</span>
          <h1 className="type-hero" style={{ fontSize: 48 }}>
            <em className="not-italic text-brand-red">Леджер</em> и&nbsp;ручные корректировки.
          </h1>
          <p className="type-lede max-w-2xl">
            Все начисления и&nbsp;списания проходят через
            {" "}<code className="font-mono text-[14px] text-ink">
              point_transactions
            </code>{" "}
            — это append-only ledger с&nbsp;идемпотентностью. Ручная
            корректировка делает запись с&nbsp;типом{" "}
            <code className="font-mono text-[14px] text-ink">
              manual_adjustment
            </code>
            {" "}и&nbsp;комментарием для аудита.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[400px_1fr]">
          <div className="flex flex-col gap-4">
            <span className="type-mono-caps">ручная корректировка</span>
            <PointsAdjustForm defaultUserId={searchParams?.userId} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="type-mono-caps">
                {searchParams?.userId
                  ? `транзакции пользователя`
                  : "последние транзакции"}
              </span>
              {searchParams?.userId ? (
                <Link
                  href="/admin/points"
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-brand-red"
                >
                  все юзеры →
                </Link>
              ) : null}
            </div>
            {searchParams?.userId ? (
              <p className="font-mono text-[12px] text-muted-2">
                фильтр: {searchParams.userId}
              </p>
            ) : null}

            {items.length === 0 ? (
              <div className="border border-ink bg-paper-2 p-6">
                <p className="text-[14px] leading-[1.55] text-graphite">
                  Транзакций нет
                  {searchParams?.userId ? " для этого пользователя" : ""}.
                </p>
              </div>
            ) : (
              <div className="border border-ink">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-ink bg-paper-2/40 text-left">
                    <tr>
                      <Th>Когда</Th>
                      <Th>Email</Th>
                      <Th>Тип</Th>
                      <Th className="text-right">Сумма</Th>
                      <Th className="text-right">Баланс</Th>
                      <Th>Источник</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t, idx) => (
                      <Row key={t.id} txn={t} first={idx === 0} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {nextCursor ? (
              <div className="flex justify-end">
                <Link
                  href={`/admin/points?${new URLSearchParams({
                    cursor: nextCursor,
                    ...(searchParams?.userId
                      ? { userId: searchParams.userId }
                      : {}),
                  }).toString()}`}
                  className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
                >
                  Следующая страница →
                </Link>
              </div>
            ) : null}
          </div>
        </Wrap>
      </section>
    </main>
  );
}

function Row({ txn, first }: { txn: AdminPointsTxn; first: boolean }) {
  const sign = txn.direction === "credit" ? "+" : "−";
  const tone =
    txn.direction === "credit" ? "text-brand-red" : "text-ink";
  return (
    <tr
      className={
        "transition-colors hover:bg-paper-2 " +
        (first ? "" : "border-t border-ink/15")
      }
    >
      <Td mono>{fmtDateTime(txn.createdAt)}</Td>
      <Td>
        <Link
          href={`/admin/points?userId=${encodeURIComponent(txn.userId)}`}
          className="font-mono text-[12px] text-ink hover:text-brand-red"
        >
          {txn.userEmail}
        </Link>
      </Td>
      <Td>
        <span className="text-ink">{reasonLabel(txn.reasonType)}</span>
        {txn.comment ? (
          <div className="text-[11px] leading-[1.4] text-muted">
            {txn.comment}
          </div>
        ) : null}
      </Td>
      <Td className={`text-right font-mono ${tone}`}>
        {sign}
        {txn.amount}&nbsp;Б
      </Td>
      <Td className="text-right" mono>
        {txn.balanceAfter}&nbsp;Б
      </Td>
      <Td>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {txn.createdByType}
        </span>
      </Td>
    </tr>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted " +
        (className ?? "")
      }
    >
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
        "px-3 py-2.5 align-top " +
        (mono ? "font-mono text-[12px] tracking-[0.04em] " : "") +
        (className ?? "")
      }
    >
      {children}
    </td>
  );
}
