"use client";

import Link from "next/link";
import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "expired" }
  | { kind: "error"; message: string };

const INPUT =
  "h-14 border border-ink bg-paper px-4 font-sans text-[15px] text-ink outline-none c3-focus placeholder:text-muted focus:bg-brand-tint/40";

/**
 * New-password form reached from a password-reset email link. The token comes
 * from the URL (passed by the server page). On success the API sets session
 * cookies via the proxy, so we hard-navigate into the cabinet.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "saving") return;
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
        user?: { roles?: string[] } | null;
      };
      if (!res.ok) {
        if (payload.code === "AUTH_INVALID_TOKEN") {
          setState({ kind: "expired" });
          return;
        }
        setState({
          kind: "error",
          message: payload.message ?? "Не получилось сохранить пароль.",
        });
        return;
      }
      const roles = payload.user?.roles ?? [];
      window.location.assign(roles.includes("partner") ? "/partner" : "/app");
    } catch {
      setState({ kind: "error", message: "Нет связи с сервером. Попробуй ещё раз." });
    }
  }

  if (state.kind === "expired") {
    return (
      <>
        <span className="type-mono-caps">ссылка устарела</span>
        <h1 className="type-h2">
          Ссылка <em className="not-italic text-brand-red">не&nbsp;подошла</em>.
        </h1>
        <p className="text-[15px] text-graphite">
          Похоже, срок действия истёк или ссылкой уже воспользовались.
          Запроси новую — придёт свежая.
        </p>
        <Link
          href="/auth?reset=1"
          className="inline-flex h-12 items-center self-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
        >
          Запросить новую →
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[420px] flex-col gap-5 text-left">
      <div className="flex flex-col gap-1">
        <span className="type-mono-caps">сброс пароля</span>
        <h1 className="font-display text-[40px] font-bold leading-none tracking-[-0.025em] text-ink">
          Новый пароль
        </h1>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="type-label">Новый пароль</span>
        <input
          type="password"
          required
          minLength={8}
          autoFocus
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="минимум 8 символов"
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
        disabled={state.kind === "saving" || password.length < 8}
        aria-busy={state.kind === "saving"}
        className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 disabled:text-graphite"
      >
        {state.kind === "saving" ? "Сохраняем…" : "Сохранить и войти →"}
      </button>

      <p className="text-[13px] text-muted">
        После сохранения мы&nbsp;выйдем из&nbsp;аккаунта на&nbsp;других
        устройствах — войди там заново с&nbsp;новым паролем.
      </p>
    </form>
  );
}
