import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckinQrBanner } from "@/components/app/checkin-qr-banner";
import { FinalCta } from "@/components/home/final-cta";
import { Journal } from "@/components/home/journal";
import { PersonalDashboard } from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { getMyTimeline } from "@/lib/api-me-timeline";
import { getDisplayNextEvent } from "@/lib/display-event";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Личный кабинет · CITYRNNG" };

export default async function AppDashboardPage() {
  const [state, session, nextEvent, timeline] = await Promise.all([
    getSiteState(),
    getSession(),
    getDisplayNextEvent(),
    getMyTimeline(0),
  ]);
  // Either real session OR dev-mock authed unlocks /app — both flow through state.isAuthed.
  if (!state.isAuthed) redirect("/auth");

  // Real code from the session; in dev-mock-authed (no real session) show a
  // sample so the QR banner renders for review. Production isAuthed always
  // implies a real session, so the sample never appears there.
  const checkinCode =
    session?.checkinCode ??
    (process.env.NODE_ENV !== "production" && !session ? "CR-DEMO7K2X9QF4" : null);

  return (
    <>
      <SiteNav state={state} />
      <main>
        <CheckinQrBanner code={checkinCode} />
        <section className="border-b border-ink bg-brand-tint/30">
          <Wrap className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
            <span className="type-mono-caps">твой кабинет</span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/profile"
                className="inline-flex h-10 items-center border border-ink bg-paper px-2.5 font-sans text-[12px] font-semibold text-ink hover:bg-ink hover:text-paper sm:px-4 sm:text-[13px]"
              >
                Профиль
              </Link>
              <Link
                href="/app/points"
                className="inline-flex h-10 items-center border border-ink bg-paper px-2.5 font-sans text-[12px] font-semibold text-ink hover:bg-ink hover:text-paper sm:px-4 sm:text-[13px]"
              >
                Баллы
              </Link>
              <Link
                href="/app/rewards"
                className="inline-flex h-10 items-center border border-ink bg-paper px-2.5 font-sans text-[12px] font-semibold text-ink hover:bg-ink hover:text-paper sm:px-4 sm:text-[13px]"
              >
                Обмены
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-10 items-center border border-ink bg-paper px-2.5 font-sans text-[12px] font-semibold text-ink hover:bg-ink hover:text-paper sm:px-4 sm:text-[13px]"
              >
                Магазин
              </Link>
            </div>
          </Wrap>
        </section>

        <PersonalDashboard user={state.user} nextEvent={nextEvent} timeline={timeline} />
        <UpcomingEvents isAuthed />
        <ShopPreview user={state.user} />
        <Journal />
        <FinalCta isAuthed />
      </main>
      <SiteFooter />
    </>
  );
}
