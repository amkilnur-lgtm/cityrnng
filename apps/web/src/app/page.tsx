import { redirect } from "next/navigation";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Journal } from "@/components/home/journal";
import { UpcomingEvents } from "@/components/home/upcoming-events";
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
  const state = await getSiteState(searchParams.state);
  // `/` is the marketing landing — authed users belong in their cabinet.
  if (state.isAuthed) redirect("/app");

  const nextEvent = await getDisplayNextEvent();
  return (
    <>
      <SiteNav state={state} />
      <main>
        <Hero event={nextEvent} />
        <HowItWorks />
        <UpcomingEvents isAuthed={false} />
        <Journal />
        <FinalCta isAuthed={false} />
      </main>
      <SiteFooter />
    </>
  );
}
