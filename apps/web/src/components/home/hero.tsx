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
        {CLUB.name} — открытое беговое сообщество. Каждую среду
        в&nbsp;{CLUB.runTime} стартуем с&nbsp;трёх точек: Центр, Проспект,
        Черниковка. После пробежки —{" "}
        <span className="bg-brand-tint px-1.5 py-0.5 font-semibold text-brand-red-ink">
          кофе и&nbsp;разговоры
        </span>
        .
      </p>

      <HeroAuthForm />
    </div>
  );
}

function HeroSide() {
  const districts = Object.values(LOCATIONS).map((l) => l.district);
  return (
    <aside className="flex flex-col lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-[4/3] border border-ink bg-paper-2">
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

      <div className="grid grid-cols-3 border border-t-0 border-ink bg-paper">
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
    <div className="flex flex-col gap-1 px-4 py-4 [&+&]:border-l [&+&]:border-ink">
      <span className="type-mono-caps">{label}</span>
      <span
        className={
          "font-display text-[20px] font-bold leading-none tracking-[-0.02em] " +
          (accent ? "text-brand-red" : "text-ink")
        }
      >
        {value}
      </span>
    </div>
  );
}
