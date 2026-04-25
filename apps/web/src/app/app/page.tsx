import Link from "next/link";
import { redirect } from "next/navigation";
import { FinalCta } from "@/components/home/final-cta";
import { Journal } from "@/components/home/journal";
import { Locations } from "@/components/home/locations";
import { NextEvent } from "@/components/home/next-event";
import { PersonalDashboard } from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { getDisplayNextEvent } from "@/lib/display-event";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Личный кабинет · CITYRNNG" };

export default async function AppDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [state, nextEvent] = await Promise.all([
    getSiteState(),
    getDisplayNextEvent(),
  ]);
  if (!state.isAuthed) redirect("/auth");

  return (
    <>
      <SiteNav state={state} />
      <main>
        {/* Welcome banner for fresh users — points/profile fetches come in Stage C/D */}
        <section className="border-b border-ink bg-brand-tint/30">
          <Wrap className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
            <p className="text-[14px] text-graphite">
              Привет,{" "}
              <b className="font-semibold text-ink">{state.user.name}</b>! Личный
              кабинет собирается — скоро появятся баланс баллов, история забегов
              и&nbsp;подключение Strava.
            </p>
            <Link
              href="/app/profile"
              className="inline-flex h-10 items-center self-start border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper md:self-auto"
            >
              Профиль →
            </Link>
          </Wrap>
        </section>

        <PersonalDashboard user={state.user} nextEvent={nextEvent} />
        <NextEvent event={nextEvent} />
        <ShopPreview user={state.user} />
        <Locations />
        <Journal />
        <FinalCta isAuthed />
      </main>
      <SiteFooter />
    </>
  );
}
