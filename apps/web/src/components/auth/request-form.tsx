"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string; expiresAt?: string; devToken?: string }
  | { kind: "error"; message: string };

export function AuthRequestForm() {
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
        expiresAt?: string;
        devToken?: string;
        message?: string;
      };
      if (!res.ok || !payload.ok) {
        setState({
          kind: "error",
          message: payload.message ?? "Не получилось отправить письмо",
        });
        return;
      }
      setState({
        kind: "sent",
        email,
        expiresAt: payload.expiresAt,
        devToken: payload.devToken,
      });
    } catch {
      setState({
        kind: "error",
        message: "Нет связи с сервером. Попробуй ещё раз.",
      });
    }
  }

  if (state.kind === "sent") {
    return <SentView state={state} onReset={() => setState({ kind: "idle" })} />;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[480px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="type-mono-caps">шаг 1 из 2</span>
        <h2 className="font-display text-[40px] font-bold leading-none tracking-[-0.025em] text-ink">
          Войти по&nbsp;email
        </h2>
      </div>

      <label htmlFor="auth-email" className="type-label">
        Email
      </label>
      <input
        id="auth-email"
        type="email"
        required
        autoFocus
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-14 border border-ink bg-paper px-4 font-sans text-[15px] text-ink outline-none placeholder:text-muted-2 focus:bg-brand-tint/40"
      />

      {state.kind === "error" ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state.kind === "sending" || !email}
        className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
      >
        {state.kind === "sending" ? "Отправляем…" : "Получить ссылку →"}
      </button>

      <p className="text-[13px] text-muted">
        Пришлём ссылку на&nbsp;email — без пароля. 20&nbsp;секунд —
        и&nbsp;ты&nbsp;в&nbsp;клубе.
      </p>
    </form>
  );
}

function SentView({
  state,
  onReset,
}: {
  state: { kind: "sent"; email: string; expiresAt?: string; devToken?: string };
  onReset: () => void;
}) {
  return (
    <div className="flex max-w-[480px] flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="block h-2 w-2 animate-pulse bg-brand-red" />
        <span className="type-mono-caps text-brand-red">
          письмо отправлено
        </span>
      </div>
      <h2 className="font-display text-[40px] font-bold leading-[0.95] tracking-[-0.025em] text-ink">
        Ссылка уже{" "}
        <em className="not-italic text-brand-red">в&nbsp;пути</em>.
      </h2>
      <p className="text-[15px] leading-[1.55] text-graphite">
        Отправили ссылку на&nbsp;
        <span className="border-b border-dashed border-ink font-mono text-ink">
          {state.email}
        </span>
        . Открой её на&nbsp;этом устройстве — и&nbsp;мы&nbsp;начнём.
      </p>

      {state.devToken ? (
        <div className="border border-ink/20 bg-paper-2 p-4 text-[13px] text-graphite">
          <div className="type-mono-caps mb-1.5 text-muted-2">
            dev · авто-ссылка
          </div>
          <a
            href={`/auth/verify?token=${encodeURIComponent(state.devToken)}`}
            className="font-mono text-brand-red underline"
          >
            /auth/verify?token={state.devToken.slice(0, 12)}…
          </a>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onReset}
        className="self-start font-sans text-[14px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline"
      >
        Ввести другой email
      </button>
    </div>
  );
}
