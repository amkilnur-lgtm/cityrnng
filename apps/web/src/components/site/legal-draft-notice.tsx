import Link from "next/link";
import { Wrap } from "@/components/site/wrap";

export function LegalDraftNotice({ slug }: { slug: string }) {
  return (
    <section className="border-b border-ink">
      <Wrap className="py-12 lg:py-16">
        <div className="flex flex-col gap-4 border border-ink bg-paper-2 p-6 md:p-10">
          <span className="type-mono-caps">draft · {slug}</span>
          <p className="max-w-[640px] text-[15px] leading-[1.55] text-graphite">
            Полный текст появится после юридической ревизии. Если у&nbsp;тебя
            прямо сейчас вопрос про данные, обработку или ответственность —
            напиши на{" "}
            <a
              href="mailto:cityrnng@yandex.com"
              className="text-ink underline underline-offset-4 hover:text-brand-red"
            >
              cityrnng@yandex.com
            </a>
            , ответим лично.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/about"
              className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              О проекте
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center border border-ink bg-paper px-4 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              На главную
            </Link>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
