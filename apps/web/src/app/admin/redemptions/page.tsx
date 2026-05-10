import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import { RedemptionVerifyForm } from "@/components/admin/redemption-verify-form";
import { listAdminPartners } from "@/lib/api-admin";
import {
  listRedemptionsAdmin,
  type ApiAdminRedemption,
  type RedemptionStatus,
} from "@/lib/api-rewards";

export const metadata = { title: "Обмены · Admin · CITYRNNG" };

const STATUSES: Array<{ value: "" | RedemptionStatus; label: string }> = [
  { value: "", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "used", label: "Погашенные" },
  { value: "expired", label: "Истёкшие" },
  { value: "cancelled", label: "Отменённые" },
];

const STATUS_LABEL: Record<RedemptionStatus, string> = {
  active: "Активен",
  used: "Погашен",
  expired: "Истёк",
  cancelled: "Отменён",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

type SearchParams = {
  status?: string;
  partnerId?: string;
  code?: string;
};

export default async function AdminRedemptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const status = isStatus(searchParams.status) ? searchParams.status : undefined;
  const partnerId = searchParams.partnerId || undefined;
  const codeQuery = searchParams.code?.trim().toUpperCase() || undefined;

  const [partners, rows] = await Promise.all([
    listAdminPartners(),
    listRedemptionsAdmin({ status, partnerId, code: codeQuery }),
  ]);

  return (
    <main>
      <section className="border-b border-ink bg-paper-2/40">
        <Wrap className="py-10">
          <Link
            href="/admin"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Админка
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            Обмены.
          </h1>
          <p className="type-lede mt-3 max-w-2xl">
            Список redemption-кодов: фильтр по статусу, партнёру или
            конкретному коду. Погашение и отмена с возвратом баллов.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="grid grid-cols-1 gap-4 py-8 lg:grid-cols-[2fr_1fr]">
          <FilterForm
            partners={partners}
            current={{
              status: status ?? "",
              partnerId: partnerId ?? "",
              code: codeQuery ?? "",
            }}
          />
          <RedemptionVerifyForm />
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {rows.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Под текущие фильтры обменов нет.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-ink">
              <table className="w-full min-w-[820px] text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Код</Th>
                    <Th>Награда</Th>
                    <Th>Партнёр</Th>
                    <Th>Пользователь</Th>
                    <Th>Цена</Th>
                    <Th>Статус</Th>
                    <Th>Создан</Th>
                    <Th>Действия</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <RedemptionRow key={r.id} row={r} divider={idx > 0} />
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

function isStatus(v: string | undefined): v is RedemptionStatus {
  return v === "active" || v === "used" || v === "expired" || v === "cancelled";
}

function FilterForm({
  partners,
  current,
}: {
  partners: Array<{ id: string; name: string }>;
  current: { status: string; partnerId: string; code: string };
}) {
  return (
    <form
      action="/admin/redemptions"
      method="get"
      className="flex flex-col gap-3 border border-ink bg-paper p-5 md:p-6"
    >
      <span className="type-mono-caps">фильтры</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Статус
          </span>
          <select
            name="status"
            defaultValue={current.status}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Партнёр
          </span>
          <select
            name="partnerId"
            defaultValue={current.partnerId}
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
          >
            <option value="">Все</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Код
          </span>
          <input
            name="code"
            defaultValue={current.code}
            placeholder="ABC234"
            className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] uppercase outline-none c3-focus"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
        >
          Применить
        </button>
        <Link
          href="/admin/redemptions"
          className="inline-flex h-10 items-center px-3 font-mono text-[12px] uppercase tracking-[0.12em] text-muted hover:text-brand-red"
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
}

function RedemptionRow({
  row,
  divider,
}: {
  row: ApiAdminRedemption;
  divider: boolean;
}) {
  const tone: "primary" | "ink" | "default" =
    row.status === "active"
      ? "primary"
      : row.status === "used"
        ? "ink"
        : "default";
  return (
    <tr
      className={
        "transition-colors hover:bg-paper-2 " +
        (divider ? "border-t border-ink/15" : "")
      }
    >
      <Td>
        <span className="font-mono text-[14px] font-semibold uppercase tracking-[0.16em] text-ink">
          {row.code}
        </span>
      </Td>
      <Td>
        <span className="font-sans text-[14px] font-semibold text-ink">
          {row.reward.title}
        </span>
      </Td>
      <Td>
        <span className="text-graphite">{row.reward.partner.name}</span>
      </Td>
      <Td>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[12px] text-ink">
            {row.user.email}
          </span>
          {row.user.profile?.displayName ? (
            <span className="text-[12px] text-muted">
              {row.user.profile.displayName}
            </span>
          ) : null}
        </div>
      </Td>
      <Td>
        <span className="font-mono text-[13px] text-brand-red">
          {row.costPoints}&nbsp;Б
        </span>
      </Td>
      <Td>
        <Badge variant={tone}>{STATUS_LABEL[row.status]}</Badge>
      </Td>
      <Td mono>{fmtDate(row.createdAt)}</Td>
      <Td>
        {row.status === "active" ? (
          <Link
            href={`/admin/redemptions/${row.id}/cancel`}
            className="font-sans text-[13px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline"
          >
            Отменить →
          </Link>
        ) : (
          <span className="text-muted">—</span>
        )}
      </Td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={
        "px-4 py-3 align-top " +
        (mono ? "font-mono text-[12px] text-ink" : "")
      }
    >
      {children}
    </td>
  );
}
