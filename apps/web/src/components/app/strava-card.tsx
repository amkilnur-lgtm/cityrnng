"use client";

import { useState, useTransition } from "react";
import {
  disconnectStravaAction,
  startStravaConnect,
  syncStravaAction,
} from "@/app/app/profile/actions";
import type { StravaStatus } from "@/lib/api-strava";

// Official Strava brand assets, copied from
// developers.strava.com/downloads/1.1-Connect-with-Strava-Buttons.zip and
// /downloads/1.2-Strava-API-Logos.zip per brand guidelines.
const STRAVA_CONNECT_BTN = "/brand/strava/btn_strava_connect_with_orange.svg";
const STRAVA_POWERED_BY_LOGO = "/brand/strava/api_logo_pwrdBy_strava_horiz_black.svg";

export function StravaCard({ status }: { status: StravaStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);

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
    // Per Strava API Agreement §2.14.vi: on disconnect we must delete the
    // user's Strava-derived data. Be honest about it in the prompt.
    if (
      !confirm(
        "Отключить Strava? История пробежек и связанные баллы будут удалены — этого требуют правила Strava.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await disconnectStravaAction();
      if (!result.ok) {
        setError("Не получилось отключить Strava.");
      }
    });
  }

  function onSync() {
    setError(null);
    setSyncInfo(null);
    startTransition(async () => {
      const result = await syncStravaAction();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const { ingested, matched, awarded } = result;
      if (ingested === 0) {
        setSyncInfo("Новых пробежек не нашли.");
      } else {
        setSyncInfo(
          `Подтянули ${ingested}, засчитали ${matched}, начислили ${awarded}.`,
        );
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
        {syncInfo ? (
          <p className="border border-ink/20 bg-paper-2 px-3 py-2 text-[13px] text-ink">
            {syncInfo}
          </p>
        ) : null}
        {error ? (
          <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSync}
            disabled={pending}
            className="inline-flex h-10 items-center border border-ink bg-paper px-4 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Синхронизируем…" : "Синхронизировать сейчас"}
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={pending}
            className="font-sans text-[13px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-50"
          >
            {pending ? "…" : "Отключить Strava"}
          </button>
        </div>
        <PoweredByStrava />
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
      <p className="text-[12px] leading-[1.5] text-muted">
        Мы получим только данные о&nbsp;твоих пробежках (дистанция, время,
        координаты старта). Не&nbsp;храним их дольше 7&nbsp;дней. Отключить
        можно в&nbsp;любой момент — данные удалим.
      </p>
      {error ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {error}
        </p>
      ) : null}
      {/* Official "Connect with Strava" button per Strava brand guidelines.
          Rendered as <img> wrapped in <button> so the click stays accessible
          and the asset isn't recoloured. */}
      <button
        type="button"
        onClick={onConnect}
        disabled={pending}
        aria-label="Connect with Strava"
        className="self-start disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img
          src={STRAVA_CONNECT_BTN}
          alt="Connect with Strava"
          height={48}
          width={193}
          className="h-12 w-auto"
        />
      </button>
      <PoweredByStrava />
    </div>
  );
}

function PoweredByStrava() {
  return (
    <div
      aria-label="Powered by Strava"
      className="mt-2 flex items-center self-start"
    >
      <img
        src={STRAVA_POWERED_BY_LOGO}
        alt="Powered by Strava"
        height={20}
        className="h-5 w-auto opacity-80"
      />
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
