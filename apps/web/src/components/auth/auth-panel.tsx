"use client";

import { useState } from "react";
import { AuthRequestForm } from "@/components/auth/request-form";
import { AuthResetRequestForm } from "@/components/auth/reset-request-form";

type Mode = "login" | "register" | "link" | "reset";

const INPUT =
  "h-14 border border-ink bg-paper px-4 font-sans text-[15px] text-ink outline-none c3-focus placeholder:text-muted focus:bg-brand-tint/40";

function errorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "EMAIL_TAKEN":
      return "Почта уже занята. Войди или восстанови пароль.";
    case "AUTH_INVALID_CREDENTIALS":
      return "Неверная почта или пароль.";
    case "NO_PASSWORD_SET":
      return "У этого аккаунта ещё нет пароля. Задай его по ссылке на почту.";
    default:
      return fallback;
  }
}

export function AuthPanel({
  initialEmail = "",
  initialMode = "login",
}: {
  initialEmail?: string;
  initialMode?: "login" | "register" | "reset";
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerReset, setOfferReset] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setOfferReset(false);

    const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body =
      mode === "register" ? { email, password, name } : { email, password };
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
        user?: { roles?: string[] };
      };
      if (!res.ok) {
        setError(errorMessage(payload.code, payload.message ?? "Что-то пошло не так."));
        if (payload.code === "NO_PASSWORD_SET") setOfferReset(true);
        setBusy(false);
        return;
      }
      // Session cookies are set — hard-navigate so the server re-reads it.
      const roles = payload.user?.roles ?? [];
      window.location.assign(roles.includes("partner") ? "/partner" : "/app");
    } catch {
      setError("Нет связи с сервером. Попробуй ещё раз.");
      setBusy(false);
    }
  }

  if (mode === "link") {
    return (
      <div className="flex max-w-[480px] flex-col gap-5">
        <AuthRequestForm initialEmail={email} />
        <button
          type="button"
          onClick={() => setMode("login")}
          className="self-start font-sans text-[14px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline"
        >
          ← Вход по паролю
        </button>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div className="flex max-w-[480px] flex-col gap-5">
        <AuthResetRequestForm initialEmail={email} />
        <button
          type="button"
          onClick={() => setMode("login")}
          className="self-start font-sans text-[14px] font-medium text-ink underline-offset-4 hover:text-brand-red hover:underline"
        >
          ← Вход по паролю
        </button>
      </div>
    );
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={submit} className="flex max-w-[480px] flex-col gap-5">
      <div
        className="flex border border-ink"
        role="tablist"
        aria-label="Вход или регистрация"
      >
        <Tab active={!isRegister} onClick={() => setMode("login")}>
          Войти
        </Tab>
        <Tab active={isRegister} onClick={() => setMode("register")}>
          Регистрация
        </Tab>
      </div>

      {isRegister ? (
        <label className="flex flex-col gap-1.5">
          <span className="type-label">Имя</span>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как тебя звать"
            className={INPUT}
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="type-label">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={INPUT}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="type-label flex items-center justify-between">
          Пароль
          {!isRegister ? (
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="-m-2 p-2 font-mono text-[11px] font-normal normal-case tracking-normal text-muted hover:text-brand-red"
            >
              Забыли пароль?
            </button>
          ) : null}
        </span>
        <input
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isRegister ? "минимум 8 символов" : "твой пароль"}
          className={INPUT}
        />
      </label>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col gap-2 border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink"
        >
          <span>{error}</span>
          {offerReset ? (
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="self-start font-semibold underline underline-offset-4"
            >
              Задать пароль по почте →
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy || !email || !password || (isRegister && !name)}
        aria-busy={busy}
        className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 disabled:text-graphite"
      >
        {busy
          ? "Секунду…"
          : isRegister
            ? "Создать аккаунт →"
            : "Войти →"}
      </button>

      <button
        type="button"
        onClick={() => setMode("link")}
        className="inline-flex h-11 items-center self-start font-sans text-[13px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline"
      >
        Войти по ссылке на почту
      </button>
    </form>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex-1 px-4 py-3 font-mono text-[12px] font-medium uppercase tracking-[0.14em] transition-colors " +
        (active ? "bg-ink text-paper" : "bg-paper text-muted hover:text-ink")
      }
    >
      {children}
    </button>
  );
}
