import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import type { SiteState } from "@/lib/home-mock";

/**
 * Standard public page chrome — nav + content + footer. Hero/title is
 * rendered by the page itself so each section can pick its own eyebrow/H1.
 */
export function PageShell({
  state,
  children,
}: {
  state: SiteState;
  children: ReactNode;
}) {
  return (
    <>
      <SiteNav state={state} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}

/**
 * Standard hero block for content pages — eyebrow + H1 + optional lede.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="flex flex-col gap-3">
          <span className="type-mono-caps">{eyebrow}</span>
          <h1 className="type-hero" style={{ fontSize: 72 }}>
            {title}
          </h1>
          {lede ? <p className="type-lede max-w-[640px]">{lede}</p> : null}
        </div>
      </Wrap>
    </section>
  );
}
