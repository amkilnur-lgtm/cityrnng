import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Journal } from "@/components/home/journal";
import { Locations } from "@/components/home/locations";
import { NextEvent } from "@/components/home/next-event";
import { PersonalDashboard } from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import { DevStateToggle } from "@/components/site/dev-state-toggle";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { getSiteState } from "@/lib/site-state";

type SearchParams = { state?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const state = await getSiteState(searchParams.state);
  const session = state.isAuthed ? state : null;

  return (
    <>
      <SiteNav state={state} />
      <main>
        {state.isAuthed ? (
          <>
            <PersonalDashboard user={state.user} />
            <NextEvent isAuthed />
            <ShopPreview user={state.user} />
            <Locations />
            <Journal />
            <FinalCta isAuthed />
          </>
        ) : (
          <>
            <Hero />
            <HowItWorks />
            <NextEvent isAuthed={false} />
            <Locations />
            <Journal />
            <FinalCta isAuthed={false} />
          </>
        )}
      </main>
      <SiteFooter />
      {!session ? <DevStateToggle /> : null}
    </>
  );
}
