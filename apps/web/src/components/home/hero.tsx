import { HeroAuthForm } from "@/components/home/hero-auth-form";
import { Wrap } from "@/components/site/wrap";
import { CLUB, wednesdaysSinceFounding } from "@/lib/club";
import type { DisplayEvent } from "@/lib/display-event";

// `event` prop kept for backward compatibility with caller; upcoming-run
// info now lives in the dedicated <UpcomingEvents> block below the fold.
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

      <HeroAuthForm />
    </div>
  );
}

function HeroSide() {
  const runs = wednesdaysSinceFounding();
  return (
    <aside className="flex flex-col lg:pb-8">
      {/* lg:pb-8 (32px) = gap-3 (12) + microcopy (~20) below the input
          on the left. With strip h-[58px] matching the form wrapper's
          58px outer height, both top and bottom of strip line up with
          input wrapper outer top/bottom. */}
      <div className="relative flex aspect-square flex-col items-center justify-center gap-3 border border-ink bg-paper-2 p-6 lg:aspect-auto lg:flex-1">
        <span className="font-display font-bold leading-none tracking-[-0.05em] text-brand-red text-[160px] lg:text-[200px]">
          {runs}
        </span>
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
          {pluralRu(runs, "пробежка проведена", "пробежки проведено", "пробежек проведено")}
        </span>
      </div>

      <div className="grid h-[58px] grid-cols-3 border border-t-0 border-ink bg-paper">
        <BrandFact label="День" value={CLUB.runDayLong} />
        <BrandFact label="Время" value={CLUB.runTime} accent />
        <BrandFact label="Дистанции" value={`${CLUB.distances.join(" / ")} км`} />
      </div>

      {/* Mirrors the "Без паролей: жми по ссылке…" microcopy under the
          email form on the left. Same body-text styling, sits under the
          column like its left-side counterpart. */}
      <p className="mt-3 text-[13px] text-muted">
        {CLUB.city} · с&nbsp;{CLUB.foundedYear} года · городские пробежки
      </p>
    </aside>
  );
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
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
