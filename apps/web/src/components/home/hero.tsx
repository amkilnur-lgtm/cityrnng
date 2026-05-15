import Image from "next/image";
import { HeroAuthForm } from "@/components/home/hero-auth-form";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";
import { LOCATIONS } from "@/lib/home-mock";

// `event` is intentionally unused for now — the upcoming-run card moved
// to the dedicated <NextEvent> section below the fold. Keeping the prop
// in the signature so the page composition stays unchanged.
export function Hero({ event: _event }: { event: DisplayEvent }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <HeroMain />
          <HeroSide />
        </div>
      </Wrap>
    </section>
  );
}

function HeroMain() {
  return (
    <div className="flex flex-col">
      <h1 className="type-hero">
        Беги по&nbsp;городу.{" "}
        <em className="not-italic text-brand-red">Не&nbsp;один.</em>
      </h1>

      <p className="type-lede mt-6 max-w-[540px]">
        Пробежки, статистика, друзья, челленджи и&nbsp;партнёрские бонусы
        в&nbsp;одной платформе{" "}
        <span className="bg-brand-tint px-1.5 py-0.5 font-semibold text-brand-red-ink">
          Сити&nbsp;Раннинг
        </span>
        .
      </p>

      <p className="mt-3 max-w-[540px] font-sans text-[14px] leading-[1.55] text-graphite">
        Пробежки по&nbsp;городу, статистика, баллы за&nbsp;активность
        и&nbsp;бонусы от&nbsp;партнёров — всё в&nbsp;одном месте.
      </p>

      <HeroAuthForm />
    </div>
  );
}

function HeroSide() {
  const districts = Object.values(LOCATIONS).map((l) => l.district);
  return (
    <aside className="flex flex-col lg:pb-8">
      {/* lg:pb-8 (32px) = gap-3 (12) + microcopy (~20) below the input
          on the left. With strip h-[58px] matching the form wrapper's
          58px outer height, both top and bottom of strip line up with
          input wrapper outer top/bottom. */}
      <div className="relative aspect-square border border-ink bg-paper-2 lg:aspect-auto lg:flex-1">
        <div className="absolute left-5 top-5 flex flex-col gap-0.5">
          <span className="type-mono-caps">Три маршрута</span>
          <span className="font-sans text-[13px] font-medium text-ink">
            {districts.join(" · ")}
          </span>
        </div>
        <Image
          src="/brand/runners.png"
          alt="Бегуны Ситираннинг"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          style={{ objectFit: "contain", padding: "8%" }}
          priority
        />
      </div>

      <div className="grid h-[58px] grid-cols-3 border border-t-0 border-ink bg-paper">
        <BrandFact label="День" value={CLUB.runDayLong} />
        <BrandFact label="Время" value={CLUB.runTime} accent />
        <BrandFact label="Дистанции" value={`${CLUB.distances.join(" / ")} км`} />
      </div>
    </aside>
  );
}

function BrandFact({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-center px-4 [&+&]:border-l [&+&]:border-ink">
      <span className="type-mono-caps text-[10px] leading-none">{label}</span>
      <span
        className={
          "mt-1 font-display text-[16px] font-bold leading-none tracking-[-0.02em] " +
          (accent ? "text-brand-red" : "text-ink")
        }
      >
        {value}
      </span>
    </div>
  );
}
