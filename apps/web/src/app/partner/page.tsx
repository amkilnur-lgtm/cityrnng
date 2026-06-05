import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { PartnerVerifyForm } from "@/components/partner/partner-verify-form";
import {
  listMyMemberships,
  listPartnerRecentRedemptions,
  type PartnerRecentRedemption,
} from "@/lib/api-partner";
import { listRewards, type ApiReward } from "@/lib/api-rewards";

export const metadata = { title: "Партнёрский кабинет · CITYRNNG" };

const STATUS_LABEL: Record<PartnerRecentRedemption["status"], string> = {
  active: "ждёт",
  used: "погашен",
  expired: "истёк",
  cancelled: "отменён",
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

function fmtName(r: PartnerRecentRedemption): string {
  return r.userDisplayName?.trim() || r.userEmail;
}

export default async function PartnerHomePage() {
  const memberships = await listMyMemberships();

  // Без привязки — только информер; запросы за историей/каталогом не делаем
  // (бессмысленно, всё равно пусто).
  if (memberships.length === 0) {
    return (
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-10">
            <span className="type-mono-caps">партнёрский кабинет</span>
            <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
              Аккаунт пока не&nbsp;привязан к&nbsp;партнёру.
            </h1>
            <p className="mt-3 max-w-prose text-[15px] text-graphite">
              Свяжись с&nbsp;администратором CITYRNNG, чтобы добавить твой
              email в&nbsp;команду заведения. После этого здесь появится
              форма для&nbsp;проверки кодов клиентов.
            </p>
          </Wrap>
        </section>
      </main>
    );
  }

  // С привязкой — параллельно тащим историю и каталоги по всем slug'ам.
  const partnerSlugs = memberships.map((m) => m.partnerSlug);
  const [history, ...catalogsBySlug] = await Promise.all([
    listPartnerRecentRedemptions(),
    ...partnerSlugs.map((slug) => listRewards({ partnerSlug: slug })),
  ]);

  // Map slug → rewards array для удобства группировки в каталоге.
  const catalogBySlug = new Map<string, ApiReward[]>();
  partnerSlugs.forEach((slug, i) => {
    catalogBySlug.set(slug, catalogsBySlug[i]);
  });

  const venueTitle =
    memberships.length === 1
      ? memberships[0].partnerName
      : "Кабинет партнёра";

  return (
    <main>
      {/* Шапка с названием заведения вместо обезличенного «Погасить код». */}
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <span className="type-mono-caps">партнёрский кабинет</span>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            {venueTitle}
          </h1>
          <p className="mt-3 max-w-prose text-[15px] text-graphite">
            Клиент показывает 6-значный код в&nbsp;своём приложении. Введи
            его ниже и&nbsp;нажми «Проверить» — код погасится, если он
            настоящий и&nbsp;принадлежит твоему заведению.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="max-w-xl py-10">
          <PartnerVerifyForm memberships={memberships} />
        </Wrap>
      </section>

      {/* История последних 20 погашений во всех связанных заведениях. */}
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <h2 className="type-mono-caps">последние погашения</h2>
          {history.length === 0 ? (
            <p className="mt-4 max-w-prose text-[14px] text-graphite">
              Пока ни&nbsp;одного погашения. Когда клиенты начнут забирать
              награды — здесь будут последние 20 операций.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col border border-ink">
              {history.map((r, idx) => (
                <li
                  key={r.id}
                  className={
                    "flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-[14px] " +
                    (idx > 0 ? "border-t border-ink/15" : "")
                  }
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                    {fmtDateTime(r.usedAt ?? r.createdAt)}
                  </span>
                  <span className="font-mono text-[13px] tracking-[0.04em] text-ink">
                    {r.code}
                  </span>
                  <span className="text-ink">{r.rewardTitle}</span>
                  <span className="text-muted">· {fmtName(r)}</span>
                  {memberships.length > 1 ? (
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                      · {r.partnerName}
                    </span>
                  ) : null}
                  <span
                    className={
                      "ml-auto inline-flex h-6 items-center border px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] " +
                      (r.status === "used"
                        ? "border-brand-red bg-brand-tint text-brand-red-ink"
                        : r.status === "active"
                          ? "border-ink/30 bg-paper text-ink"
                          : "border-muted-2 bg-paper-2 text-muted")
                    }
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Wrap>
      </section>

      {/* Каталог наград твоего заведения (или каждого, если их несколько). */}
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <h2 className="type-mono-caps">каталог наград</h2>
          <p className="mt-2 max-w-prose text-[14px] text-graphite">
            Это то, что клиенты могут у&nbsp;тебя забрать за&nbsp;баллы.
            Список ведёт админ CITYRNNG.
          </p>
          <div className="mt-6 flex flex-col gap-8">
            {memberships.map((m) => {
              const rewards = (catalogBySlug.get(m.partnerSlug) ?? []).filter(
                (r) => r.status === "active",
              );
              return (
                <div key={m.partnerId} className="flex flex-col gap-3">
                  {memberships.length > 1 ? (
                    <h3 className="type-mono-caps">{m.partnerName}</h3>
                  ) : null}
                  {rewards.length === 0 ? (
                    <p className="text-[13px] text-muted">
                      У&nbsp;заведения пока нет активных наград.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {rewards.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-col gap-1 border border-ink bg-paper p-4"
                        >
                          <span className="font-sans text-[15px] font-semibold text-ink">
                            {r.title}
                          </span>
                          <span className="font-mono text-[13px] text-brand-red">
                            {r.costPoints}&nbsp;Б
                          </span>
                          {r.description ? (
                            <span className="text-[13px] leading-snug text-graphite">
                              {r.description}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-8">
          <Link
            href="/app"
            className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← На свою runner-страницу
          </Link>
        </Wrap>
      </section>
    </main>
  );
}
