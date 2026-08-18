import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckinQrBanner } from "@/components/app/checkin-qr-banner";
import {
  PersonalDashboard,
  type RewardProgress,
} from "@/components/home/personal-dashboard";
import { ShopPreview } from "@/components/home/shop-preview";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { listRewards } from "@/lib/api-rewards";
import { getMyTimeline } from "@/lib/api-me-timeline";
import { CLUB } from "@/lib/club";
import { getDisplayNextEvent } from "@/lib/display-event";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Личный кабинет · CITYRNNG" };

const CABINET_LINKS = [
  { href: "/app/profile", label: "Профиль" },
  { href: "/app/points", label: "Баллы" },
  { href: "/app/rewards", label: "Обмены" },
  { href: "/shop", label: "Магазин" },
];

export default async function AppDashboardPage() {
  const [state, session, nextEvent, timeline, rewards] = await Promise.all([
    getSiteState(),
    getSession(),
    getDisplayNextEvent(),
    getMyTimeline(0),
    listRewards(),
  ]);
  // Either real session OR dev-mock authed unlocks /app — both flow through state.isAuthed.
  if (!state.isAuthed) redirect("/auth");

  // Real code from the session; in dev-mock-authed (no real session) show a
  // sample so the QR ticket renders for review. Production isAuthed always
  // implies a real session, so the sample never appears there.
  const checkinCode =
    session?.checkinCode ??
    (process.env.NODE_ENV !== "production" && !session ? "CR-DEMO7K2X9QF4" : null);

  // Nearest reward the runner is saving toward: the cheapest one they can't
  // afford yet. Ties balance ↔ redeem so the dashboard nudges progress.
  const balance = state.user.points;
  const nextReward = rewards
    .filter((r) => r.costPoints > balance)
    .sort((a, b) => a.costPoints - b.costPoints)[0];
  let progress: RewardProgress | null = nextReward
    ? {
        rewardTitle: nextReward.title,
        partnerName: nextReward.partner.name,
        cost: nextReward.costPoints,
        balance,
      }
    : null;
  // Dev-mock (no API rewards) — show a sample so the nudge renders for review.
  if (!progress && process.env.NODE_ENV !== "production" && rewards.length === 0) {
    progress = {
      rewardTitle: "Капучино",
      partnerName: "Monkey Grinder",
      cost: 160,
      balance: 120,
    };
  }

  return (
    <>
      <SiteNav state={state} />
      <main className="bg-paper">
        {/* Cabinet quick-nav — soft rounded pills on the warm ground */}
        <Wrap className="flex flex-wrap items-center gap-2 py-5">
          <span className="type-mono-caps mr-1">твой кабинет</span>
          {CABINET_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex h-10 items-center rounded-full bg-paper-2 px-4 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-paper-3"
            >
              {l.label}
            </Link>
          ))}
        </Wrap>

        <PersonalDashboard
          user={state.user}
          nextEvent={nextEvent}
          timeline={timeline}
          progress={progress}
        />
        <CheckinQrBanner code={checkinCode} />
        <UpcomingEvents isAuthed />
        <ShopPreview user={state.user} />
      </main>

      {/* Slim app footer — not the marketing footer */}
      <footer className="bg-paper">
        <Wrap className="flex flex-wrap items-center justify-between gap-3 border-t border-line/10 py-6 text-[12px] text-muted">
          <span className="font-mono uppercase tracking-[0.14em]">
            {CLUB.name} · {CLUB.city}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/app/profile" className="hover:text-brand-red">
              Профиль
            </Link>
            <Link href="/faq" className="hover:text-brand-red">
              Помощь
            </Link>
            <Link href="/" className="hover:text-brand-red">
              На сайт
            </Link>
          </div>
        </Wrap>
      </footer>
    </>
  );
}
