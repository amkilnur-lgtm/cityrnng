"use client";

import { useState, useTransition } from "react";
import {
  disconnectStravaAction,
  startStravaConnect,
} from "@/app/app/profile/actions";
import type { StravaStatus } from "@/lib/api-strava";

export function StravaCard({ status }: { status: StravaStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConnect() {
    setError(null);
    startTransition(async () => {
      const result = await startStravaConnect();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      window.location.href = result.url;
    });
  }

  function onDisconnect() {
    if (!confirm("Отключить Strava? История пробежек останется.")) return;
    setError(null);
    startTransition(async () => {
      const result = await disconnectStravaAction();
      if (!result.ok) {
        setError("Не получилось отключить Strava.");
      }
    });
  }

  if (status.connected) {
    const expires = status.tokenExpiresAt
      ? new Date(status.tokenExpiresAt).toLocaleString("ru-RU")
      : "—";
    return (
      <div className="flex flex-col gap-4 border border-ink bg-paper p-6 md:p-8">
        <div className="flex items-center gap-2">
          <span className="block h-2 w-2 bg-brand-red" aria-hidden />
          <span className="type-mono-caps text-brand-red">strava подключен</span>
        </div>
        <h3 className="type-h3">Засчитываем пробежки автоматически</h3>
        <dl className="grid grid-cols-1 gap-2 text-[13px] md:grid-cols-2">
          <Row k="Provider ID" v={status.providerUserId} />
          <Row k="Scope" v={status.scope} />
          <Row
            k="Подключён"
            v={new Date(status.connectedAt).toLocaleDateString("ru-RU")}
          />
          <Row k="Токен живёт до" v={expires} />
        </dl>
        {error ? (
          <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onDisconnect}
          disabled={pending}
          className="self-start font-sans text-[13px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-50"
        >
          {pending ? "Отключаем…" : "Отключить Strava"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-ink bg-paper-2 p-6 md:p-8">
      <span className="type-mono-caps">strava не подключен</span>
      <h3 className="type-h3">
        Подключи Strava — получай{" "}
        <em className="not-italic text-brand-red">баллы автоматически</em>
      </h3>
      <p className="text-[15px] leading-[1.55] text-graphite">
        Без подключения мы&nbsp;не&nbsp;увидим твой забег и&nbsp;не&nbsp;сможем
        начислить баллы. Один раз подключаешь — дальше всё само.
      </p>
      {error ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onConnect}
        disabled={pending}
        className="inline-flex h-12 items-center self-start border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper transition-colors hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
      >
        {pending ? "Открываем Strava…" : "Подключить Strava →"}
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/15 py-1.5">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-mono text-ink">{v}</dd>
    </div>
  );
}
