"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

/**
 * Compact homepage entry-point form. Same fetch contract as
 * AuthRequestForm on /auth — kept inline so the hero is a one-click
 * conversion path (no redirect-then-resubmit dance).
 */
export function HeroAuthForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "sending") return;
    setState({ kind: "sending" });

    try {
      const res = await fetch("/api/auth/request-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!res.ok || !payload.ok) {
        setState({
          kind: "error",
          message: payload.message ?? "Не получилось отправить письмо",
        });
        return;
      }
      setState({ kind: "sent", email });
    } catch {
      setState({
        kind: "error",
        message: "Нет связи с сервером. Попробуй ещё раз.",
      });
    }
  }

  if (state.kind === "sent") {
    return (
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 animate-pulse bg-brand-red" />
          <span className="type-mono-caps text-brand-red">
            письмо отправлено
          </span>
        </div>
        <p className="text-[15px] leading-[1.55] text-graphite">
          Ссылка летит на&nbsp;
          <span className="border-b border-dashed border-ink font-mono text-ink">
            {state.email}
          </span>
          . Открой её в&nbsp;этом браузере.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="self-start font-sans text-[14px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline"
        >
          Ввести другой email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-3">
      <label htmlFor="hero-email" className="type-label">
        Войти или&nbsp;зарегистрироваться
      </label>
      <div className="flex h-14 flex-col border border-ink sm:flex-row">
        <input
          id="hero-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 bg-paper px-4 font-sans text-[15px] text-ink outline-none placeholder:text-muted-2 focus:bg-brand-tint/40"
        />
        <button
          type="submit"
          disabled={state.kind === "sending" || !email}
          className="h-14 border-t border-ink bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 sm:border-l sm:border-t-0"
        >
          {state.kind === "sending" ? "Отправляем…" : "Получить ссылку →"}
        </button>
      </div>

      {state.kind === "error" ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {state.message}
        </p>
      ) : null}

      <p className="text-[13px] text-muted">
        Пришлём ссылку на&nbsp;email — без пароля. 20&nbsp;секунд —
        и&nbsp;ты&nbsp;в&nbsp;клубе.
      </p>
    </form>
  );
}
