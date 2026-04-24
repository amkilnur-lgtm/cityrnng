import Link from "next/link";
import { Wrap } from "@/components/site/wrap";

type Step = {
  n: string;
  title: string;
  titleEm: string;
  titleTail?: string;
  body: React.ReactNode;
  metaLeft: string;
  metaRight: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Вступаешь в ",
    titleEm: "клуб",
    body: (
      <>
        Регистрируешься по&nbsp;email, подключаешь{" "}
        <b className="font-semibold text-ink">Strava</b> — один раз.
        Записываться на&nbsp;каждую среду не&nbsp;нужно, просто приходи.
      </>
    ),
    metaLeft: "один раз",
    metaRight: "+50 Б",
  },
  {
    n: "02",
    title: "Приходишь в ",
    titleEm: "среду",
    body: (
      <>
        Каждую <b className="font-semibold text-ink">среду в&nbsp;19:30</b> —
        две дистанции на&nbsp;выбор,{" "}
        <b className="font-semibold text-ink">5 или&nbsp;10&nbsp;км</b>. Темп
        любой, Strava сама зафиксирует и&nbsp;начислит баллы.
      </>
    ),
    metaLeft: "темп любой",
    metaRight: "+30 / +60 Б",
  },
  {
    n: "03",
    title: "Меняешь на ",
    titleEm: "кофе",
    body: (
      <>
        Заходишь в&nbsp;любую кофейню-партнёра, показываешь QR — получаешь{" "}
        <b className="font-semibold text-ink">
          капучино, круассан или&nbsp;книгу
        </b>
        .
      </>
    ),
    metaLeft: "37 партнёров",
    metaRight: "−50 Б",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-16 lg:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <span className="type-mono-caps">как это работает</span>
            <h2 className="type-h2">
              Три шага между{" "}
              <em className="not-italic text-brand-red">кроссовками</em>{" "}
              и&nbsp;капучино.
            </h2>
          </div>
          <Link
            href="/faq"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            FAQ →
          </Link>
        </div>

        <div className="grid grid-cols-1 border-t border-ink md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <div
              key={step.n}
              className={
                "flex flex-col gap-4 p-6 md:p-8" +
                (idx > 0 ? " border-t border-ink md:border-l md:border-t-0" : "")
              }
            >
              <span className="type-hero text-muted-2" style={{ fontSize: 120, lineHeight: 0.85 }}>
                {step.n}
              </span>
              <h3 className="type-h3">
                {step.title}
                <em className="not-italic text-brand-red">{step.titleEm}</em>
                {step.titleTail}
              </h3>
              <p className="text-[15px] leading-[1.55] text-graphite">
                {step.body}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-ink/20 pt-4">
                <span className="type-mono-caps">{step.metaLeft}</span>
                <b className="font-mono text-[13px] font-medium text-ink">
                  {step.metaRight}
                </b>
              </div>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
