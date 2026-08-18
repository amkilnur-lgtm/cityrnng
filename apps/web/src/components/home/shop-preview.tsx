import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import {
  PARTNERS as MOCK_PARTNERS,
  REWARDS as MOCK_REWARDS,
  type AuthedUser,
} from "@/lib/home-mock";
import { listRewards } from "@/lib/api-rewards";

type PreviewItem = {
  slug: string;
  title: string;
  costPoints: number;
  partnerName: string;
};

export async function ShopPreview({ user }: { user: AuthedUser }) {
  const apiRewards = await listRewards();

  const fromApi: PreviewItem[] = apiRewards.map((r) => ({
    slug: r.slug,
    title: r.title,
    costPoints: r.costPoints,
    partnerName: r.partner.name,
  }));
  const fromMock: PreviewItem[] = MOCK_REWARDS.map((r) => ({
    slug: r.slug,
    title: r.title,
    costPoints: r.costPoints,
    partnerName: MOCK_PARTNERS[r.partnerSlug].name,
  }));
  const all = fromApi.length > 0 ? fromApi : fromMock;

  // Pick 3 cheapest items the user can actually afford — friendlier preview.
  const affordable = all
    .filter((r) => r.costPoints <= user.points)
    .sort((a, b) => a.costPoints - b.costPoints)
    .slice(0, 3);
  const items = affordable.length === 3 ? affordable : all.slice(0, 3);

  return (
    <section>
      <Wrap className="py-10 lg:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="type-mono-caps">твои баллы · на что копишь</span>
            <h2 className="type-h2">
              Накопил — <em className="not-italic text-brand-red">выбирай</em>.
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex h-10 items-center rounded-full bg-paper-2 px-4 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-paper-3"
          >
            Весь магазин →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr]">
          {/* Balance — warm card, gold number (red reserved for "today") */}
          <div className="flex flex-col items-start justify-center gap-1 rounded-3xl bg-paper ring-2 ring-brand-yellow p-6">
            <span className="type-mono-caps">Баллов</span>
            <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em] text-[#B8860B]">
              {user.points}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <Link
                href={`/shop/${item.slug}`}
                key={item.slug}
                className="flex flex-col gap-2 rounded-3xl bg-paper-2 p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="type-mono-caps">{item.partnerName}</span>
                <span className="type-h3">{item.title}</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="inline-flex items-center rounded-full bg-brand-yellow/30 px-2.5 py-1 font-mono text-[13px] font-bold text-[#8A6D00]">
                    {item.costPoints}&nbsp;Б
                  </span>
                  <span className="text-[13px] font-semibold text-ink">
                    Обменять →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
