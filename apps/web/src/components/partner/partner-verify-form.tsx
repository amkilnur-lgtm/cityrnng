"use client";

import { useState, useTransition } from "react";
import {
  verifyPartnerCodeAction,
  type VerifyResult,
} from "@/app/partner/actions";
import type { PartnerMembership } from "@/lib/api-partner";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PartnerVerifyForm({
  memberships,
}: {
  memberships: PartnerMembership[];
}) {
  const [partnerId, setPartnerId] = useState<string>(
    memberships[0]?.partnerId ?? "",
  );
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !code.trim()) return;
    const id = memberships.length > 1 ? partnerId : memberships[0].partnerId;
    startTransition(async () => {
      const r = await verifyPartnerCodeAction(id ?? null, code);
      setResult(r);
      if (r.ok) setCode("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {memberships.length > 1 ? (
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            Заведение
          </span>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="h-12 border border-ink bg-paper px-3 font-sans text-[15px] text-ink"
          >
            {memberships.map((m) => (
              <option key={m.partnerId} value={m.partnerId}>
                {m.partnerName}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
          вы работаете в:{" "}
          <span className="text-ink">{memberships[0].partnerName}</span>
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          Код клиента (6 символов)
        </span>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          placeholder="A2BCDE"
          className="h-16 border border-ink bg-paper px-4 text-center font-mono text-[28px] tracking-[0.4em] text-ink"
        />
      </label>

      <button
        type="submit"
        disabled={pending || code.trim().length === 0}
        className="inline-flex h-14 items-center justify-center border border-brand-red bg-brand-red px-6 font-sans text-[15px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2"
      >
        {pending ? "Проверяем…" : "Проверить →"}
      </button>

      {result ? (
        result.ok ? (
          <div className="border border-brand-red bg-paper p-4">
            <span className="type-mono-caps text-brand-red">погашен</span>
            <p className="mt-2 text-[15px] text-ink">
              <strong>{result.rewardTitle}</strong>
              <br />
              <span className="text-muted">{result.partnerName}</span>
            </p>
            <p className="mt-2 font-mono text-[12px] text-muted">
              {result.code} · {formatTime(result.usedAt)}
            </p>
          </div>
        ) : (
          <div className="border border-ink bg-paper p-4" role="alert">
            <span className="type-mono-caps">не получилось</span>
            <p className="mt-2 text-[15px] text-ink">{result.message}</p>
          </div>
        )
      ) : null}
    </form>
  );
}
