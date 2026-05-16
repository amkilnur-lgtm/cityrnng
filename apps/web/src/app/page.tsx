import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Journal } from "@/components/home/journal";
import { NextEvent } from "@/components/home/next-event";
import { PersonalDashboard } from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { getDisplayNextEvent } from "@/lib/display-event";
import { getSiteState } from "@/lib/site-state";

type SearchParams = { state?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [state, nextEvent] = await Promise.all([
    getSiteState(searchParams.state),
    getDisplayNextEvent(),
  ]);

  return (
    <>
      <SiteNav state={state} />
      <main>
        {state.isAuthed ? (
          <>
            <PersonalDashboard user={state.user} nextEvent={nextEvent} />
            <NextEvent event={nextEvent} isAuthed />
            <ShopPreview user={state.user} />
            <Journal />
            <FinalCta isAuthed />
          </>
        ) : (
          <>
            <Hero event={nextEvent} />
            <HowItWorks />
            <NextEvent event={nextEvent} />
            <Journal />
            <FinalCta isAuthed={false} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
