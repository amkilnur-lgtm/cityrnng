import { LeaderScanner } from "@/components/leader/leader-scanner";
import { Wrap } from "@/components/site/wrap";
import { listLeaderLocations } from "@/lib/api-leader";

export const metadata = { title: "Лидер · CITYRNNG" };

export default async function LeaderPage() {
  const locations = await listLeaderLocations();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col gap-2 py-10">
          <span className="type-mono-caps">лидер · отметка на точке</span>
          <h1 className="type-h2">
            Отмечай <em className="not-italic text-brand-red">бегунов</em>
          </h1>
          <p className="max-w-2xl text-[14px] leading-[1.55] text-graphite">
            Когда на&nbsp;точке нет сканера — отмечай приход сам. Выбери точку,
            наведи камеру на&nbsp;QR бегуна (или введи код вручную) — зачёт
            пройдёт так&nbsp;же, как через сканер.
          </p>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-8">
          {locations.length === 0 ? (
            <div className="flex flex-col gap-3 border border-ink bg-paper-2 p-6">
              <span className="type-mono-caps">точек нет</span>
              <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">
                Нет активных точек сбора. Обратись к&nbsp;администратору.
              </p>
            </div>
          ) : (
            <LeaderScanner locations={locations} />
          )}
        </Wrap>
      </section>
    </main>
  );
}
