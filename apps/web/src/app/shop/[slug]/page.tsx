import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { RedeemButton } from "@/components/shop/redeem-button";
import {
  PARTNERS as MOCK_PARTNERS,
  REWARDS as MOCK_REWARDS,
} from "@/lib/home-mock";
import { getReward } from "@/lib/api-rewards";
import { getSiteState } from "@/lib/site-state";
import { redeemAndRedirect } from "./actions";

type RewardView = {
  slug: string;
  title: string;
  description: string | null;
  costPoints: number;
  badge: string | null;
  partner: {
    slug: string;
    name: string;
    description: string | null;
    locations: string[];
  };
};

function buildRewardView(slug: string): RewardView | null {
  const mock = MOCK_REWARDS.find((r) => r.slug === slug);
  if (!mock) return null;
  const partner = (MOCK_PARTNERS as Record<string, { slug: string; name: string; shortDescription: string; locations: string[] }>)[
    mock.partnerSlug
  ];
  if (!partner) return null;
  return {
    slug: mock.slug,
    title: mock.title,
    description: mock.description ?? null,
    costPoints: mock.costPoints,
    badge: mock.badge ?? null,
    partner: {
      slug: partner.slug,
      name: partner.name,
      description: partner.shortDescription,
      locations: partner.locations,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const apiReward = await getReward(params.slug);
  const reward =
    apiReward != null
      ? { title: apiReward.title }
      : buildRewardView(params.slug);
  return {
    title: reward
      ? `${reward.title} · Магазин · CITYRNNG`
      : "Магазин · CITYRNNG",
  };
}

export default async function RewardDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { err?: string };
}) {
  const [state, apiReward] = await Promise.all([
    getSiteState(),
    getReward(params.slug),
  ]);

  let view: RewardView | null = null;
  if (apiReward) {
    const fallbackPartner = (MOCK_PARTNERS as Record<string, { locations: string[] }>)[
      apiReward.partner.slug
    ];
    view = {
      slug: apiReward.slug,
      title: apiReward.title,
      description: apiReward.description,
      costPoints: apiReward.costPoints,
      badge: apiReward.badge,
      partner: {
        slug: apiReward.partner.slug,
        name: apiReward.partner.name,
        description: apiReward.partner.description,
        locations: fallbackPartner?.locations ?? [],
      },
    };
  } else {
    view = buildRewardView(params.slug);
  }
  if (!view) notFound();

  const userPoints = state.isAuthed ? state.user.points : 0;
  const canAfford = state.isAuthed && userPoints >= view.costPoints;
  const insufficient = state.isAuthed && !canAfford;
  const remaining = canAfford ? userPoints - view.costPoints : 0;
  const errorMessage = searchParams?.err;

  // Bound the action to this slug — server actions can't carry per-call args
  // through a <form action> attribute, so we build a closure here.
  const redeemBound = redeemAndRedirect.bind(null, view.slug);

  return (
    <PageShell state={state}>
      <main>
        <section className="border-b border-ink">
          <Wrap className="py-12 lg:py-16">
            <Link
              href="/shop"
              className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
            >
              ← Магазин
            </Link>

            <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
              <div className="flex flex-col gap-4">
                {view.badge ? (
                  <span className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red">
                    {view.badge}
                  </span>
                ) : null}
                <span className="type-mono-caps">{view.partner.name}</span>
                <h1 className="type-hero" style={{ fontSize: 64 }}>
                  {view.title}
                </h1>
                {view.description ? (
                  <p className="type-lede">{view.description}</p>
                ) : null}
              </div>

              <aside className="flex flex-col gap-6 border border-ink bg-paper p-6 md:p-8">
                <div className="flex items-baseline justify-between border-b border-ink pb-4">
                  <span className="type-mono-caps">цена</span>
                  <span className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-brand-red">
                    {view.costPoints}&nbsp;Б
                  </span>
                </div>

                {state.isAuthed ? (
                  <div className="flex flex-col gap-1.5 text-[14px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Твой баланс</span>
                      <span className="font-mono text-ink">
                        {userPoints}&nbsp;Б
                      </span>
                    </div>
                    {canAfford ? (
                      <div className="flex justify-between">
                        <span className="text-muted">После обмена</span>
                        <span className="font-mono text-ink">
                          {remaining}&nbsp;Б
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-brand-red-ink">Не хватает</span>
                        <span className="font-mono text-brand-red-ink">
                          {view.costPoints - userPoints}&nbsp;Б
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}

                {!state.isAuthed ? (
                  <Link
                    href="/auth"
                    className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper hover:bg-brand-red-ink"
                  >
                    Войти, чтобы обменять →
                  </Link>
                ) : insufficient ? (
                  <Link
                    href="/"
                    className="inline-flex h-14 items-center justify-center border border-ink bg-paper px-6 font-sans text-[15px] font-semibold text-ink hover:bg-ink hover:text-paper"
                  >
                    Беги в&nbsp;среду — добери баллы →
                  </Link>
                ) : (
                  <form action={redeemBound}>
                    <RedeemButton />
                  </form>
                )}

                {errorMessage ? (
                  <p className="border border-brand-red/40 bg-brand-tint/40 px-3 py-2 font-mono text-[12px] text-brand-red-ink">
                    {errorMessage}
                  </p>
                ) : null}

                <p className="text-[12px] leading-[1.55] text-muted">
                  После обмена в&nbsp;разделе{" "}
                  <Link
                    href="/app/rewards"
                    className="text-ink underline-offset-4 hover:text-brand-red hover:underline"
                  >
                    «Мои обмены»
                  </Link>{" "}
                  появится 6-значный код. Покажи его в&nbsp;кофейне — бариста
                  отдаст позицию.
                </p>
              </aside>
            </div>
          </Wrap>
        </section>

        <section className="border-b border-ink">
          <Wrap className="grid grid-cols-1 gap-8 py-12 lg:grid-cols-2 lg:py-16">
            <div className="flex flex-col gap-4">
              <span className="type-mono-caps">где забрать</span>
              <h2 className="type-h2">{view.partner.name}</h2>
              {view.partner.description ? (
                <p
                  className="text-[15px] leading-[1.55] text-graphite"
                  dangerouslySetInnerHTML={{ __html: view.partner.description }}
                />
              ) : null}
              {view.partner.locations.length > 0 ? (
                <ul className="flex flex-col gap-2 pt-2">
                  {view.partner.locations.map((loc) => (
                    <li
                      key={loc}
                      className="flex items-center justify-between border-t border-ink/15 py-2 text-[14px]"
                    >
                      <span className="text-ink">{loc}</span>
                      <a
                        href={`https://yandex.ru/maps/?text=${encodeURIComponent(`${view!.partner.name} ${loc} Уфа`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] tracking-[0.04em] text-muted hover:text-brand-red"
                      >
                        на карте ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <span className="type-mono-caps">условия</span>
              <ul className="flex flex-col gap-3 text-[14px] leading-[1.55] text-graphite">
                <li className="flex gap-3">
                  <span className="font-mono text-brand-red">→</span>
                  <span>
                    Код действует 7&nbsp;дней с&nbsp;момента обмена.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-brand-red">→</span>
                  <span>
                    Один код = один обмен. После использования код
                    сгорает.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-brand-red">→</span>
                  <span>
                    Если не&nbsp;успел использовать — пиши, вернём баллы.
                  </span>
                </li>
              </ul>
            </div>
          </Wrap>
        </section>
      </main>
    </PageShell>
  );
}
