import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { listAdminUsers } from "@/lib/api-admin";
import { runStravaDebug, type StravaTraceActivity } from "@/lib/api-admin-strava";

export const metadata = { title: "Strava debug · Admin · CITYRNNG" };

// Human-readable labels for the stable reason keys returned by the API.
// Keep keys in sync with whyRuleDoesntMatch() in attendance-matcher.service.ts.
const REASON_LABELS: Record<string, string> = {
  time_window: "Активность не попала в окно события (±30 мин)",
  type_mismatch: "Тип активности не подходит (не бег / не совпал с rule.activityType)",
  min_distance: "Дистанция меньше минимума по правилу",
  max_distance: "Дистанция больше максимума по правилу",
  min_duration: "Длительность меньше минимума по правилу",
  max_duration: "Длительность больше максимума по правилу",
  geofence: "Старт/финиш активности вне геофенса локаций события",
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtKm(meters: number): string {
  return `${(meters / 1000).toFixed(2)} км`;
}

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtReason(key: string): string {
  return REASON_LABELS[key] ?? key;
}

export default async function AdminStravaDebugPage({
  searchParams,
}: {
  searchParams: { userId?: string; after?: string; before?: string };
}) {
  const usersPage = await listAdminUsers({ limit: 200 });
  const users = usersPage.rows;

  const userId = searchParams.userId ?? "";
  const after = searchParams.after ?? "";
  const before = searchParams.before ?? "";

  const result =
    userId.length > 0
      ? await runStravaDebug({
          userId,
          after: after || undefined,
          before: before || undefined,
        })
      : null;

  const selectedUser = users.find((u) => u.id === userId);

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/strava"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Strava
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            Дебаг матчинга
          </h1>
          <p className="type-lede mt-3 max-w-2xl">
            Выбери юзера — покажем все его подтянутые из Strava активности и
            почему конкретно каждая не сматчилась с событиями (тип / время /
            дистанция / геофенс).
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-10">
          <form
            method="GET"
            className="flex flex-col gap-4 border border-ink bg-paper p-6 md:flex-row md:flex-wrap md:items-end md:gap-6 md:p-8"
          >
            <Field label="Юзер" htmlFor="userId" wide>
              <select
                id="userId"
                name="userId"
                defaultValue={userId}
                className="h-11 w-full border border-ink bg-paper px-3 font-sans text-[14px]"
              >
                <option value="">— выбери —</option>
                {users.map((u) => {
                  const name =
                    u.profile?.displayName ||
                    [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") ||
                    u.email;
                  return (
                    <option key={u.id} value={u.id}>
                      {name} ({u.email})
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="С (after)" htmlFor="after">
              <input
                id="after"
                name="after"
                type="datetime-local"
                defaultValue={after}
                className="h-11 w-full border border-ink bg-paper px-3 font-mono text-[13px]"
              />
            </Field>
            <Field label="По (before)" htmlFor="before">
              <input
                id="before"
                name="before"
                type="datetime-local"
                defaultValue={before}
                className="h-11 w-full border border-ink bg-paper px-3 font-mono text-[13px]"
              />
            </Field>
            <button
              type="submit"
              className="inline-flex h-11 items-center border border-brand-red bg-brand-red px-4 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
            >
              Показать
            </button>
          </form>
          <p className="mt-3 text-[12px] text-muted">
            Окно по умолчанию: до 30 дней назад от текущего момента (как при
            обычном sync'е). Если задать поля — отфильтруется ровно по ним.
            Side-effect free, ничего не пишется в БД.
          </p>
        </Wrap>
      </section>

      {selectedUser && result ? (
        <section className="border-b border-ink">
          <Wrap className="py-10">
            <h2 className="type-h2">
              {result.matchedCount}/{result.activitiesEvaluated} сматчено
            </h2>
            <p className="mt-2 text-[13px] text-graphite">
              Юзер: <span className="font-mono">{selectedUser.email}</span>
            </p>

            {result.activities.length === 0 ? (
              <div className="mt-6 border border-ink bg-paper-2 p-6 text-[14px] text-graphite">
                <strong className="block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  пусто
                </strong>
                <span className="mt-2 block">
                  В выбранном окне нет ингестированных активностей. Запусти
                  sync на главной /app/profile или Admin → Strava → нет debug
                  без активностей.
                </span>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                {result.activities.map((a) => (
                  <ActivityRow key={a.externalId} activity={a} />
                ))}
              </div>
            )}
          </Wrap>
        </section>
      ) : null}
    </main>
  );
}

function Field({
  label,
  htmlFor,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-1.5 " + (wide ? "md:min-w-[320px] md:flex-1" : "md:min-w-[200px]")}>
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ActivityRow({ activity }: { activity: StravaTraceActivity }) {
  const matched = activity.matchedEventId != null;
  return (
    <details
      className={
        "border " +
        (matched
          ? "border-brand-red/40 bg-brand-tint/15"
          : "border-ink/30 bg-paper")
      }
      open={!matched && activity.candidates.length > 0}
    >
      <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4 text-[14px]">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {fmtDateTime(activity.startedAt)}
        </span>
        <span className="font-mono text-[13px] text-ink">
          {activity.activityType ?? "—"}
        </span>
        <span className="font-mono text-[13px] text-ink">{fmtKm(activity.distanceMeters)}</span>
        <span className="font-mono text-[13px] text-ink">{fmtDuration(activity.elapsedSeconds)}</span>
        {matched ? (
          <span className="ml-auto font-sans text-[13px] font-semibold text-brand-red-ink">
            ✓ матч с «{activity.matchedEventTitle}»
          </span>
        ) : activity.candidates.length === 0 ? (
          <span className="ml-auto font-sans text-[13px] text-muted">
            нет событий в окне
          </span>
        ) : (
          <span className="ml-auto font-sans text-[13px] text-muted">
            {activity.candidates.length} кандидат(ов)
          </span>
        )}
      </summary>
      {activity.candidates.length > 0 ? (
        <div className="border-t border-ink/20 px-5 py-4">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="pb-2">Событие</th>
                <th className="pb-2">Тип</th>
                <th className="pb-2">Когда</th>
                <th className="pb-2">Причины несовпадения</th>
              </tr>
            </thead>
            <tbody>
              {activity.candidates.map((c) => (
                <tr key={c.eventId} className="border-t border-ink/10 align-top">
                  <td className="py-2 pr-3 font-sans text-ink">{c.eventTitle}</td>
                  <td className="py-2 pr-3 font-mono text-[12px] text-graphite">{c.eventType}</td>
                  <td className="py-2 pr-3 font-mono text-[12px] text-graphite">{fmtDateTime(c.eventStartsAt)}</td>
                  <td className="py-2">
                    {c.reasons.length === 0 ? (
                      <span className="font-sans font-semibold text-brand-red-ink">
                        ✓ совпало бы (но что-то перехватило — см. one-per-day)
                      </span>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {c.reasons.map((r) => (
                          <li key={r} className="text-graphite">
                            • {fmtReason(r)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </details>
  );
}
