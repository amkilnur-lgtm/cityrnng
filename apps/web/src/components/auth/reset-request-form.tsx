"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string; devToken?: string }
  | { kind: "error"; message: string };

const INPUT =
  "h-14 border border-ink bg-paper px-4 font-sans text-[15px] text-ink outline-none c3-focus placeholder:text-muted focus:bg-brand-tint/40";

/**
 * "Forgot password" — enter email to receive a reset link. Response is the
 * same whether or not the address has an account (no enumeration), so the
 * sent-view copy is deliberately neutral about existence.
 */
export function AuthResetRequestForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
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
      setState({ kind: "sent", email, devToken: payload.devToken });
    } catch {
      setState({ kind: "error", message: "Нет связи с сервером. Попробуй ещё раз." });
    }
  }

  if (state.kind === "sent") {
    return (
      <div className="flex max-w-[480px] flex-col gap-5">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 animate-pulse bg-brand-red" />
          <span className="type-mono-caps text-brand-red">письмо отправлено</span>
        </div>
        <h2 className="font-display text-[36px] font-bold leading-[0.95] tracking-[-0.025em] text-ink">
          Проверь <em className="not-italic text-brand-red">почту</em>.
        </h2>
        <p className="text-[15px] leading-[1.55] text-graphite">
          Если на&nbsp;
          <span className="border-b border-dashed border-ink font-mono text-ink">
            {state.email}
          </span>{" "}
          есть аккаунт — придёт ссылка для&nbsp;сброса пароля. Открой её
          на&nbsp;этом устройстве.
        </p>

        {state.devToken ? (
          <div className="border border-ink/20 bg-paper-2 p-4 text-[13px] text-graphite">
            <div className="type-mono-caps mb-1.5 text-muted">dev · авто-ссылка</div>
            <a
              href={`/auth/reset?token=${encodeURIComponent(state.devToken)}`}
              className="font-mono text-brand-red underline"
            >
              /auth/reset?token={state.devToken.slice(0, 12)}…
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[480px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="type-mono-caps">сброс пароля</span>
        <h2 className="font-display text-[36px] font-bold leading-none tracking-[-0.025em] text-ink">
          Забыли пароль?
        </h2>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="type-label">Email</span>
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={INPUT}
        />
      </label>

      <p
        role="alert"
        aria-live="polite"
        className={
          state.kind === "error"
            ? "border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink"
            : "sr-only"
        }
      >
        {state.kind === "error" ? state.message : ""}
      </p>

      <button
        type="submit"
        disabled={state.kind === "sending" || !email}
        aria-busy={state.kind === "sending"}
        className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 disabled:text-graphite"
      >
        {state.kind === "sending" ? "Отправляем…" : "Прислать ссылку →"}
      </button>

      <p className="text-[13px] text-muted">
        Пришлём ссылку — по&nbsp;ней задашь новый пароль.
      </p>
    </form>
  );
}
