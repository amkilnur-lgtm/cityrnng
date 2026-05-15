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
    title: "Присоединяешься к ",
    titleEm: "пробежке",
    body: (
      <>
        Выбираешь локацию, регистрируешься и&nbsp;бежишь
        в&nbsp;удобном для&nbsp;себя темпе.
      </>
    ),
    metaLeft: "каждую среду",
    metaRight: "участие бесплатно",
  },
  {
    n: "02",
    title: "Получаешь ",
    titleEm: "баллы",
    body: (
      <>
        После пробежки баллы начисляются в&nbsp;личный кабинет
        автоматически.
      </>
    ),
    metaLeft: "темп любой",
    metaRight: "+30 баллов за участие",
  },
  {
    n: "03",
    title: "Обмениваешь баллы на ",
    titleEm: "бонусы",
    body: (
      <>
        Используешь накопленные баллы у&nbsp;партнёров: кофе, парфюм, еда,
        товары, услуги и&nbsp;другие предложения от&nbsp;партнёров.
      </>
    ),
    metaLeft: "партнёры сообщества",
    metaRight: "от 50 баллов",
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
              Три шага от&nbsp;пробежки до&nbsp;
              <em className="not-italic text-brand-red">бонусов</em>.
            </h2>
          </div>
          <Link
            href="/faq"
            className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            FAQ →
          </Link>
        </div>

        <div className="grid grid-cols-1 border border-ink md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <div
              key={step.n}
              className={
                "flex flex-col gap-4 p-6 md:p-8" +
                (idx > 0 ? " border-t border-ink md:border-l md:border-t-0" : "")
              }
            >
              <span className="type-hero text-muted" style={{ fontSize: 120, lineHeight: 0.85 }}>
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
