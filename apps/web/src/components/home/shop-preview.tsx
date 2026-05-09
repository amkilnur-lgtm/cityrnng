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
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">магазин баллов</span>
            <h2 className="type-h2">
              <em className="not-italic text-brand-red">
                {user.points}&nbsp;Б
              </em>{" "}
              — выбирай.
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Весь магазин →
          </Link>
        </div>

        <div className="grid grid-cols-1 border border-ink md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
          <div className="flex items-center justify-center border-b border-ink bg-brand-red p-8 md:border-b-0 md:border-r">
            <div className="flex flex-col items-center gap-1 text-paper">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">
                Баллов
              </span>
              <span className="font-display text-[80px] font-bold leading-none tracking-[-0.04em]">
                {user.points}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y divide-ink md:grid-cols-3 md:divide-x md:divide-y-0">
            {items.map((item) => (
              <Link
                href={`/shop/${item.slug}`}
                key={item.slug}
                className="flex flex-col gap-3 p-5 transition-colors hover:bg-paper-2 md:p-6"
              >
                <span className="type-mono-caps">{item.partnerName}</span>
                <span className="type-h3">{item.title}</span>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-mono text-[14px] font-medium tracking-[0.04em] text-brand-red">
                    {item.costPoints}&nbsp;Б
                  </span>
                  <span className="text-[13px] font-medium text-ink">
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
