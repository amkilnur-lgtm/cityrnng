"use client";

import { useState, useTransition } from "react";
import {
  addPromoCodesAction,
  type PromoStats,
} from "@/app/admin/rewards/actions";

export function PromoPoolPanel({
  rewardId,
  initial,
}: {
  rewardId: string;
  initial: PromoStats;
}) {
  const [stats, setStats] = useState<PromoStats>(initial);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setMsg(null);
    start(async () => {
      const res = await addPromoCodesAction(rewardId, text);
      if (res.ok) {
        setStats({ available: res.available, assigned: stats.assigned, total: res.total });
        setMsg({
          ok: true,
          text: `Добавлено ${res.added}${res.skipped ? `, пропущено дублей ${res.skipped}` : ""}.`,
        });
        setText("");
      } else {
        setMsg({ ok: false, text: res.message });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 border border-ink bg-paper-2 p-6">
      <div className="flex flex-col gap-1">
        <span className="type-mono-caps">пул промокодов</span>
        <p className="text-[13px] leading-[1.5] text-graphite">
          Вставь промокоды партнёра списком — по одному на&nbsp;строку. При
          обмене выдаётся один; когда закончатся — награда «раскуплена».
        </p>
      </div>

      <div className="flex gap-3 font-mono text-[13px]">
        <span className="rounded-full bg-paper px-3 py-1">
          свободно: <b className="text-ink">{stats.available}</b>
        </span>
        <span className="rounded-full bg-paper px-3 py-1 text-muted">
          выдано: {stats.assigned}
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"MG-XY12AB\nMG-QW34CD\nMG-ZZ99RT"}
        className="border border-ink bg-paper px-3 py-2 font-mono text-[13px] outline-none c3-focus focus:bg-brand-tint/30"
      />

      {msg ? (
        <span
          className={
            "text-[13px] " + (msg.ok ? "text-ink" : "text-brand-red-ink")
          }
        >
          {msg.text}
        </span>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !text.trim()}
        className="inline-flex h-11 items-center justify-center self-start border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
      >
        {pending ? "Загружаем…" : "Добавить в пул"}
      </button>
    </div>
  );
}
