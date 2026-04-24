"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type State =
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function AuthVerifyClient({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "verifying" });
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        if (!res.ok) {
          setState({
            kind: "error",
            message:
              payload.message ??
              "Ссылка не подошла. Возможно, истёк срок действия — запроси новую.",
          });
          return;
        }
        setState({ kind: "success" });
        router.replace("/app");
      } catch {
        setState({
          kind: "error",
          message: "Нет связи с сервером. Попробуй ещё раз.",
        });
      }
    })();
  }, [token, router]);

  if (state.kind === "verifying") {
    return (
      <>
        <span className="type-mono-caps">проверяем ссылку</span>
        <h1 className="type-h2">
          Ещё <em className="not-italic text-brand-red">секунда</em>…
        </h1>
        <p className="text-[15px] text-graphite">
          Подтверждаем токен и&nbsp;логиним тебя в&nbsp;клуб.
        </p>
      </>
    );
  }

  if (state.kind === "success") {
    return (
      <>
        <span className="type-mono-caps text-brand-red">готово</span>
        <h1 className="type-h2">
          Ты&nbsp;в&nbsp;
          <em className="not-italic text-brand-red">клубе</em>.
        </h1>
        <p className="text-[15px] text-graphite">
          Перенаправляем в&nbsp;личный кабинет…
        </p>
      </>
    );
  }

  return (
    <>
      <span className="type-mono-caps">не&nbsp;получилось</span>
      <h1 className="type-h2">
        Ссылка <em className="not-italic text-brand-red">не&nbsp;подошла</em>.
      </h1>
      <p className="text-[15px] text-graphite">{state.message}</p>
      <Link
        href="/auth"
        className="inline-flex h-12 items-center self-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
      >
        ← Запросить новую ссылку
      </Link>
    </>
  );
}
