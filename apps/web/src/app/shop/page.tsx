import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import {
  PARTNERS as MOCK_PARTNERS,
  REWARDS as MOCK_REWARDS,
  type PartnerSlug,
} from "@/lib/home-mock";
import {
  listPartners,
  listRewards,
  type ApiPartner,
  type ApiReward,
} from "@/lib/api-rewards";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Магазин баллов · CITYRNNG" };

type PartnerView = {
  slug: string;
  name: string;
  shortDescription: string;
  locations: string[];
};

type RewardView = {
  slug: string;
  partnerSlug: string;
  title: string;
  description: string | null;
  costPoints: number;
  badge: string | null;
};

/**
 * Build display data: prefer real API; fall back to home-mock when API is
 * empty (offline dev or pre-seed). Mock partners' `locations` array stays
 * authoritative for now — backend doesn't model partner addresses yet.
 */
function buildView(
  apiPartners: ApiPartner[],
  apiRewards: ApiReward[],
): { partners: PartnerView[]; rewards: RewardView[] } {
  if (apiPartners.length === 0 || apiRewards.length === 0) {
    const mockPartners = (Object.keys(MOCK_PARTNERS) as PartnerSlug[]).map(
      (slug) => ({
        slug: MOCK_PARTNERS[slug].slug,
        name: MOCK_PARTNERS[slug].name,
        shortDescription: MOCK_PARTNERS[slug].shortDescription,
        locations: MOCK_PARTNERS[slug].locations,
      }),
    );
    const mockRewards = MOCK_REWARDS.map<RewardView>((r) => ({
      slug: r.slug,
      partnerSlug: r.partnerSlug,
      title: r.title,
      description: r.description ?? null,
      costPoints: r.costPoints,
      badge: r.badge ?? null,
    }));
    return { partners: mockPartners, rewards: mockRewards };
  }

  const partners = apiPartners.map<PartnerView>((p) => {
    const fallback = (MOCK_PARTNERS as Record<string, { locations: string[] }>)[
      p.slug
    ];
    return {
      slug: p.slug,
      name: p.name,
      shortDescription: p.description ?? "",
      locations: fallback?.locations ?? [],
    };
  });
  const rewards = apiRewards.map<RewardView>((r) => ({
    slug: r.slug,
    partnerSlug: r.partner.slug,
    title: r.title,
    description: r.description,
    costPoints: r.costPoints,
    badge: r.badge,
  }));
  return { partners, rewards };
}

export default async function ShopPage() {
  const [state, apiPartners, apiRewards] = await Promise.all([
    getSiteState(),
    listPartners(),
    listRewards(),
  ]);
  const userPoints = state.isAuthed ? state.user.points : 0;
  const { partners, rewards } = buildView(apiPartners, apiRewards);

  const grouped = partners
    .map((partner) => ({
      partner,
      rewards: rewards.filter((r) => r.partnerSlug === partner.slug),
    }))
    .filter((g) => g.rewards.length > 0);

  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="магазин баллов"
        title={
          <>
            Кофе и&nbsp;
            <em className="not-italic text-brand-red">круассаны</em> за&nbsp;
            пробежки.
          </>
        }
        lede={
          state.isAuthed
            ? `На счету ${userPoints} баллов. Меняй у партнёров клуба — QR-код приходит сразу после обмена.`
            : "После пробежки начисляем баллы. Меняй на кофе и выпечку у партнёров клуба."
        }
      />

      {state.isAuthed ? (
        <section className="border-b border-ink bg-brand-tint/30">
          <Wrap className="flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:justify-between">
            <div className="flex items-baseline gap-3">
              <span className="type-mono-caps">баланс</span>
              <span className="font-mono text-[24px] font-medium tracking-[0.04em] text-brand-red">
                {userPoints}&nbsp;Б
              </span>
            </div>
            <Link
              href="/app/points"
              className="font-sans text-[14px] font-medium text-ink hover:text-brand-red"
            >
              История баллов →
            </Link>
          </Wrap>
        </section>
      ) : null}

      {grouped.map((g, idx) => (
        <section
          key={g.partner.slug}
          id={g.partner.slug}
          className="scroll-mt-24 border-b border-ink"
        >
          <Wrap className="py-12 lg:py-16">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-2">
                <span className="type-mono-caps">партнёр {String(idx + 1).padStart(2, "0")}</span>
                <h2 className="type-h2">{g.partner.name}</h2>
                {g.partner.shortDescription ? (
                  <p
                    className="type-lede max-w-2xl"
                    dangerouslySetInnerHTML={{ __html: g.partner.shortDescription }}
                  />
                ) : null}
              </div>
              {g.partner.locations.length > 0 ? (
                <ul className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
                  {g.partner.locations.map((loc) => (
                    <li
                      key={loc}
                      className="inline-flex h-8 items-center border border-ink/30 px-3 font-mono text-[12px] font-medium tracking-[0.04em] text-muted"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="grid grid-cols-1 border border-ink md:grid-cols-2 lg:grid-cols-4">
              {g.rewards.map((reward, i) => (
                <RewardCard
                  key={reward.slug}
                  reward={reward}
                  index={i}
                  isAuthed={state.isAuthed}
                  userPoints={userPoints}
                />
              ))}
            </div>
          </Wrap>
        </section>
      ))}

      <section className="border-b border-ink bg-paper-2/60">
        <Wrap className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="type-h2 max-w-2xl">
            Хочешь стать{" "}
            <em className="not-italic text-brand-red">партнёром</em>?
          </h2>
          <Link
            href="/partners"
            className="inline-flex h-12 items-center self-start border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
          >
            Условия →
          </Link>
        </Wrap>
      </section>
    </PageShell>
  );
}

function RewardCard({
  reward,
  index,
  isAuthed,
  userPoints,
}: {
  reward: RewardView;
  index: number;
  isAuthed: boolean;
  userPoints: number;
}) {
  const canAfford = isAuthed && userPoints >= reward.costPoints;
  const insufficient = isAuthed && !canAfford;

  // Border math for the responsive grid (1 / 2 / 4 columns).
  const borderClasses = [
    index > 0 && "border-t border-ink/15",
    index % 2 === 1 && "md:border-l md:border-ink",
    index >= 2 && "md:border-t md:border-ink/15",
    index % 4 !== 0 && "lg:border-l lg:border-ink",
    "lg:border-t-0",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={`flex flex-col gap-3 p-5 md:p-6 ${borderClasses}`}>
      {reward.badge ? (
        <span className="self-start font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-brand-red">
          {reward.badge}
        </span>
      ) : null}
      <h3 className="type-h3">{reward.title}</h3>
      {reward.description ? (
        <p className="text-[13px] leading-[1.5] text-graphite">
          {reward.description}
        </p>
      ) : null}
      <div className="mt-auto flex items-center justify-between border-t border-ink/15 pt-3">
        <span
          className={
            "font-mono text-[16px] font-medium tracking-[0.04em] " +
            (insufficient ? "text-muted-2" : "text-brand-red")
          }
        >
          {reward.costPoints}&nbsp;Б
        </span>
        {!isAuthed ? (
          <Link
            href="/auth"
            className="font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
          >
            Войти →
          </Link>
        ) : insufficient ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
            не хватает {reward.costPoints - userPoints}&nbsp;Б
          </span>
        ) : (
          <Link
            href={`/shop/${reward.slug}`}
            className="font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
          >
            Обменять →
          </Link>
        )}
      </div>
    </article>
  );
}
