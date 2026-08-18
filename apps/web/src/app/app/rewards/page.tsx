import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import {
  RedemptionTicket,
  type TicketView,
} from "@/components/app/redemption-ticket";
import { SiteNav } from "@/components/site/nav";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import {
  MY_REDEMPTIONS,
  PARTNERS as MOCK_PARTNERS,
  REWARDS as MOCK_REWARDS,
  type Redemption as MockRedemption,
} from "@/lib/home-mock";
import { listMyRedemptions, type ApiRedemption } from "@/lib/api-rewards";
import { getSession } from "@/lib/session";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Мои купоны · CITYRNNG" };

const STATUS_LABEL: Record<TicketView["status"], string> = {
  active: "активен",
  used: "использован",
  expired: "истёк",
  cancelled: "отменён",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function fromApi(r: ApiRedemption): TicketView {
  const fallback = (MOCK_PARTNERS as Record<string, { locations: string[] }>)[
    r.reward.partner.slug
  ];
  return {
    id: r.id,
    status: r.status,
    code: r.code,
    costPoints: r.costPoints,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    rewardTitle: r.reward.title,
    partnerName: r.reward.partner.name,
    partnerLocations: fallback?.locations ?? [],
  };
}

function fromMock(r: MockRedemption): TicketView {
  const reward = MOCK_REWARDS.find((x) => x.slug === r.rewardSlug);
  const partner = reward
    ? (MOCK_PARTNERS as Record<string, { name: string; locations: string[] }>)[
        reward.partnerSlug
      ]
    : undefined;
  return {
    id: r.slug,
    status: r.status,
    code: r.code,
    costPoints: r.costPoints,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt ?? null,
    rewardTitle: reward?.title ?? "Награда удалена",
    partnerName: partner?.name ?? "—",
    partnerLocations: partner?.locations ?? [],
  };
}

export default async function MyRewardsPage() {
  const state = await getSiteState();
  if (!state.isAuthed) redirect("/auth");

  const session = await getSession();
  const redemptions: TicketView[] = session
    ? (await listMyRedemptions()).map(fromApi)
    : MY_REDEMPTIONS.map(fromMock);

  const active = redemptions.filter((r) => r.status === "active");
  const past = redemptions.filter((r) => r.status !== "active");

  // Real scannable QR for each active coupon (server-rendered SVG).
  const svgs = new Map<string, string>();
  await Promise.all(
    active.map(async (r) => {
      svgs.set(
        r.id,
        await QRCode.toString(r.code, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        }),
      );
    }),
  );

  return (
    <>
      <SiteNav state={state} />
      <main className="bg-paper">
        <Wrap className="flex flex-col gap-2 py-8">
          <Link
            href="/app"
            className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Кабинет
          </Link>
          <span className="type-mono-caps mt-2">мои купоны</span>
          <h1 className="type-h2">
            {active.length > 0 ? (
              <>
                Готовы к&nbsp;<em className="not-italic text-brand-red">обмену</em>&nbsp;🎟️
              </>
            ) : (
              <>Копи баллы&nbsp;<em className="not-italic text-brand-red">на кофе</em></>
            )}
          </h1>
          <p className="type-lede max-w-xl">
            Покажи QR на&nbsp;кассе партнёра — бариста отсканирует и&nbsp;отдаст позицию.
          </p>
        </Wrap>

        {active.length > 0 ? (
          <Wrap className="pb-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {active.map((r) => (
                <RedemptionTicket key={r.id} ticket={r} svg={svgs.get(r.id) ?? ""} />
              ))}
            </div>
          </Wrap>
        ) : (
          <Wrap className="pb-8">
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-brand-yellow-tint p-8 text-center">
              <Image
                src="/brand/character.png"
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 object-contain"
              />
              <p className="max-w-sm text-[15px] leading-[1.55] text-graphite">
                Пока ни&nbsp;одного купона. Набегай баллы&nbsp;— и&nbsp;меняй их
                на&nbsp;кофе у&nbsp;партнёров. В&nbsp;следующий раз!&nbsp;👟
              </p>
              <Link
                href="/shop"
                className="inline-flex h-11 items-center rounded-full bg-ink px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red"
              >
                Смотреть награды →
              </Link>
            </div>
          </Wrap>
        )}

        {past.length > 0 ? (
          <Wrap className="pb-12">
            <span className="type-mono-caps mb-3 block">история</span>
            <ul className="flex flex-col divide-y divide-ink/10 overflow-hidden rounded-3xl bg-paper-2">
              {past.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="text-[14px] font-medium text-ink">
                      {r.rewardTitle}
                      <span className="text-muted"> · {r.partnerName}</span>
                    </span>
                  </div>
                  <span className="shrink-0 text-right font-mono text-[12px] text-muted">
                    −{r.costPoints}&nbsp;Б
                    <br />
                    {fmtDate(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Wrap>
        ) : null}
      </main>

      <footer className="bg-paper">
        <Wrap className="flex flex-wrap items-center justify-between gap-3 border-t border-line/10 py-6 text-[12px] text-muted">
          <span className="font-mono uppercase tracking-[0.14em]">
            {CLUB.name} · {CLUB.city}
          </span>
          <Link href="/app" className="hover:text-brand-red">
            ← Кабинет
          </Link>
        </Wrap>
      </footer>
    </>
  );
}
