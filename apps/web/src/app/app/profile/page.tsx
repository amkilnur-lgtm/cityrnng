import Link from "next/link";
import { redirect } from "next/navigation";
import { StravaCard } from "@/components/app/strava-card";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { getStravaStatus } from "@/lib/api-strava";
import { CLUB } from "@/lib/club";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Профиль · CITYRNNG" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { strava?: string; reason?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [stravaStatus, state] = await Promise.all([
    getStravaStatus(),
    getSiteState(),
  ]);
  const stravaFlash = searchParams.strava;
  const stravaReason = searchParams.reason;
  const profile = session.profile;
  const displayName =
    profile?.displayName?.trim() || session.email.split("@")[0];

  return (
    <>
      <SiteNav state={state} />
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <Link
              href="/app"
              className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
            >
              ← Дашборд
            </Link>
            <h1 className="type-hero mt-4" style={{ fontSize: 64 }}>
              {displayName}
            </h1>
            <p className="type-lede mt-2">{session.email}</p>
          </Wrap>
        </section>

        {stravaFlash === "connected" ? (
          <section className="border-b border-ink bg-brand-tint/30">
            <Wrap className="flex items-center gap-3 py-4 text-[14px]">
              <span className="block h-2 w-2 bg-brand-red" aria-hidden />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red">
                strava подключён
              </span>
              <span className="text-graphite">
                Готово — теперь среды засчитываются автоматически.
              </span>
            </Wrap>
          </section>
        ) : null}
        {stravaFlash === "error" ? (
          <section className="border-b border-ink bg-paper-2">
            <Wrap className="flex flex-wrap items-center gap-3 py-4 text-[14px]">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red-ink">
                ошибка strava
              </span>
              <span className="text-graphite">
                Не получилось подключить
                {stravaReason ? (
                  <>
                    {" "}
                    (<code className="font-mono text-[12px] text-ink">{stravaReason}</code>)
                  </>
                ) : null}
                . Попробуй ещё раз.
              </span>
            </Wrap>
          </section>
        ) : null}

        <section className="border-b border-ink">
          <Wrap className="grid grid-cols-1 gap-8 py-12 lg:grid-cols-2 lg:py-16">
            <div className="flex flex-col gap-6">
              <h2 className="type-h2">Профиль</h2>
              <dl className="flex flex-col gap-3 border border-ink bg-paper">
                <Row k="Email" v={session.email} />
                <Row k="Имя" v={profile?.firstName ?? "—"} />
                <Row k="Фамилия" v={profile?.lastName ?? "—"} />
                <Row k="Город" v={profile?.city ?? CLUB.city} />
                <Row
                  k="Telegram"
                  v={profile?.telegramHandle ?? "—"}
                />
                <Row
                  k="Instagram"
                  v={profile?.instagramHandle ?? "—"}
                />
                <Row k="Роли" v={session.roles.join(", ") || "—"} />
              </dl>
              <p className="text-[13px] text-muted">
                Редактирование профиля — в&nbsp;админке (Epic 1 follow-up).
                Скоро будет здесь.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="type-h2">Интеграции</h2>
              <StravaCard status={stravaStatus} />
            </div>
          </Wrap>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/15 px-5 py-3 text-[14px] last:border-b-0">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right text-ink">{v}</dd>
    </div>
  );
}
