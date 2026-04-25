import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthRequestForm } from "@/components/auth/request-form";
import { Wrap } from "@/components/site/wrap";
import { CLUB } from "@/lib/club";
import { getSession } from "@/lib/session";

export const metadata = { title: "Вход · CITYRNNG" };

export default async function AuthPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center border-b border-ink bg-paper">
        <Wrap className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="CITYRNNG"
            className="flex items-baseline gap-1.5 no-underline"
          >
            <span className="font-display text-[22px] font-bold leading-none tracking-[-0.025em] text-ink">
              city<span className="text-brand-red">rnng</span>
            </span>
            <span className="hidden font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted md:inline">
              {CLUB.city}
            </span>
          </Link>
          <Link
            href="/"
            className="font-sans text-[14px] font-medium text-ink hover:text-brand-red"
          >
            ← На главную
          </Link>
        </Wrap>
      </header>

      <Wrap className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-2">
        <section className="flex flex-col justify-center gap-6 border-b border-ink bg-paper-2 p-8 md:p-12 lg:border-b-0 lg:border-r lg:p-16">
          <span className="type-mono-caps">вход · регистрация</span>
          <h1 className="type-h2">
            Бегаем по&nbsp;
            <em className="not-italic text-brand-red">средам</em>
            .<br />
            Одна ссылка на&nbsp;email — и&nbsp;ты&nbsp;в&nbsp;клубе.
          </h1>
          <ul className="flex flex-col gap-3 text-[15px] leading-[1.55] text-graphite">
            <li className="flex gap-3">
              <span className="font-mono text-brand-red">→</span>
              <span>Без пароля. Магик-линк придёт на&nbsp;почту.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-brand-red">→</span>
              <span>
                Регистрация — один раз.{" "}
                <b className="font-semibold text-ink">+50 баллов</b>{" "}
                приветственных.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-brand-red">→</span>
              <span>
                На&nbsp;пробежки записываться не&nbsp;нужно — приходи, Strava сама
                фиксирует.
              </span>
            </li>
          </ul>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <AuthRequestForm />
        </section>
      </Wrap>
    </main>
  );
}
