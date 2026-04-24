import Link from "next/link";
import { Wrap } from "@/components/site/wrap";
import { SHOP_PREVIEW, type AuthedUser } from "@/lib/home-mock";

export function ShopPreview({ user }: { user: AuthedUser }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">магазин баллов</span>
            <h2 className="type-h2">
              <em className="not-italic text-brand-red">{user.points} баллов</em> — хватит
              на&nbsp;вот это.
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
            {SHOP_PREVIEW.map((item) => (
              <Link
                href={`/shop/${item.id}`}
                key={item.id}
                className="flex flex-col gap-3 p-5 transition-colors hover:bg-paper-2 md:p-6"
              >
                <span className="type-mono-caps">{item.partner}</span>
                <span className="type-h3">{item.name}</span>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-mono text-[14px] font-medium tracking-[0.04em] text-brand-red">
                    {item.price}&nbsp;Б
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
