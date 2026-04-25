import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthVerifyClient } from "@/components/auth/verify-client";
import { Wrap } from "@/components/site/wrap";
import { getSession } from "@/lib/session";

export const metadata = { title: "Проверка ссылки · CITYRNNG" };

export default async function AuthVerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const session = await getSession();
  if (session) redirect("/app");

  const token = searchParams.token;
  if (!token) {
    return (
      <main className="flex min-h-screen items-center">
        <Wrap className="flex max-w-xl flex-col gap-6 py-16 text-center">
          <span className="type-mono-caps">ссылка не найдена</span>
          <h1 className="type-h2">
            В&nbsp;ссылке нет{" "}
            <em className="not-italic text-brand-red">токена</em>.
          </h1>
          <p className="text-[15px] text-graphite">
            Похоже, ты&nbsp;открыл обрезанную ссылку. Попробуй снова запросить
            письмо.
          </p>
          <Link
            href="/auth"
            className="inline-flex h-12 items-center self-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
          >
            ← Запросить ещё раз
          </Link>
        </Wrap>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center">
      <Wrap className="flex max-w-xl flex-col gap-6 py-16 text-center">
        <AuthVerifyClient token={token} />
      </Wrap>
    </main>
  );
}
