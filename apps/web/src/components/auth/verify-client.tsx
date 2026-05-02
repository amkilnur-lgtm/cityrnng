"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Magic-link confirmation step.
 *
 * Why a manual button instead of auto-fire on mount: mobile email clients
 * (Gmail iOS, Mail.app, etc.) pre-fetch links for safety scanning and
 * preview rendering — and they execute JS while doing it. An auto-fire
 * useEffect would consume the one-shot token before the user actually
 * clicks the link from their inbox, so when they do click they land on
 * "ссылка не подошла". Forcing an explicit click here guarantees the
 * token is only spent on a real human action.
 */
export function AuthVerifyClient({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const router = useRouter();

  async function confirm() {
    if (state.kind === "verifying") return;
    setState({ kind: "verifying" });
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

  if (state.kind === "error") {
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

  return (
    <>
      <span className="type-mono-caps">подтверждение входа</span>
      <h1 className="type-h2">
        Подтверди вход в&nbsp;
        <em className="not-italic text-brand-red">клуб</em>.
      </h1>
      <p className="text-[15px] text-graphite">
        Нажми кнопку ниже — и&nbsp;мы&nbsp;залогиним тебя на&nbsp;этом
        устройстве.
      </p>
      <button
        type="button"
        onClick={confirm}
        disabled={state.kind === "verifying"}
        className="inline-flex h-14 items-center justify-center self-center border border-brand-red bg-brand-red px-8 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
      >
        {state.kind === "verifying" ? "Заходим…" : "Войти →"}
      </button>
    </>
  );
}
