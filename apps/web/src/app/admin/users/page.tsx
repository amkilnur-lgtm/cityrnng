import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { UserRoleToggle } from "@/components/admin/user-role-toggle";
import { listAdminUsers, type AdminUser } from "@/lib/api-admin";

export const metadata = { title: "Пользователи · Admin · CITYRNNG" };

const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function rolesOf(user: AdminUser): string[] {
  return user.roles.map((r) => r.role.code);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { cursor?: string };
}) {
  const { rows, nextCursor } = await listAdminUsers({
    cursor: searchParams?.cursor,
    limit: 50,
  });

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col items-start gap-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">пользователи</span>
            <h1 className="type-hero" style={{ fontSize: 48 }}>
              {rows.length}{" "}
              <em className="not-italic text-brand-red">
                {rows.length === 1
                  ? "пользователь"
                  : rows.length < 5
                    ? "пользователя"
                    : "пользователей"}
              </em>
              {nextCursor ? "+" : ""}
            </h1>
            <p className="type-lede max-w-2xl">
              Магик-линк создаёт runner-аккаунт автоматически. Здесь можно
              вручную назначить роли admin или partner. Снять{" "}
              <code className="font-mono text-[14px] text-ink">runner</code>{" "}
              нельзя — это базовая роль каждого.
            </p>
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          {rows.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
              <span className="type-mono-caps">пока пусто</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Пользователей нет — либо API недоступен, либо никто ещё
                не&nbsp;логинился. Войди по&nbsp;магик-линку и&nbsp;запиши
                себе admin через сидер (
                <code className="font-mono text-[13px] text-ink">SEED_ADMIN_EMAIL</code>
                ).
              </p>
            </div>
          ) : (
            <div className="border border-ink">
              <table className="w-full text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Email</Th>
                    <Th>Имя</Th>
                    <Th>Статус</Th>
                    <Th>Роли</Th>
                    <Th>Баланс</Th>
                    <Th>Создан</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u, idx) => {
                    const userRoles = rolesOf(u);
                    return (
                      <tr
                        key={u.id}
                        className={
                          "transition-colors hover:bg-paper-2 " +
                          (idx > 0 ? "border-t border-ink/15" : "")
                        }
                      >
                        <Td>
                          <span className="font-mono text-[13px] text-ink">
                            {u.email}
                          </span>
                          <div className="font-mono text-[10px] text-muted-2">
                            {u.id}
                          </div>
                        </Td>
                        <Td>
                          {u.profile?.displayName ? (
                            <span className="text-ink">
                              {u.profile.displayName}
                            </span>
                          ) : (
                            <span className="text-muted-2">—</span>
                          )}
                          {u.profile?.city ? (
                            <div className="font-mono text-[11px] text-muted">
                              {u.profile.city}
                            </div>
                          ) : null}
                        </Td>
                        <Td>
                          <Badge
                            variant={u.status === "active" ? "active" : "muted"}
                          >
                            {u.status}
                          </Badge>
                        </Td>
                        <Td>
                          <div className="flex flex-col items-start gap-1.5">
                            <UserRoleToggle
                              userId={u.id}
                              role="admin"
                              active={userRoles.includes("admin")}
                            />
                            <UserRoleToggle
                              userId={u.id}
                              role="partner"
                              active={userRoles.includes("partner")}
                            />
                          </div>
                        </Td>
                        <Td mono>
                          {u.pointAccount ? (
                            <span className="text-ink">
                              {u.pointAccount.balance}&nbsp;Б
                            </span>
                          ) : (
                            <span className="text-muted-2">—</span>
                          )}
                        </Td>
                        <Td mono>{fmtDate(u.createdAt)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {nextCursor ? (
            <div className="mt-6 flex justify-end">
              <Link
                href={`/admin/users?cursor=${encodeURIComponent(nextCursor)}`}
                className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
              >
                Следующая страница →
              </Link>
            </div>
          ) : null}
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
      ? "border-muted-2 bg-paper-2 text-muted-2"
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
