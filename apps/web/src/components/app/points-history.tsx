"use client";

import { useState } from "react";
import {
  reasonLabel,
  type PointsHistory,
  type PointsTxn,
} from "@/lib/api-points-types";

type Props = {
  initial: PointsHistory;
  pageSize: number;
};

export function PointsHistoryList({ initial, pageSize }: Props) {
  const [rows, setRows] = useState<PointsTxn[]>(initial.rows);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (loading || !cursor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/points/history?limit=${pageSize}&cursor=${encodeURIComponent(cursor)}`,
      );
      const body = (await res.json().catch(() => ({}))) as Partial<PointsHistory> & {
        message?: string;
      };
      if (!res.ok) {
        setError(body.message ?? "Не получилось загрузить ещё.");
        return;
      }
      setRows((prev) => [...prev, ...(body.rows ?? [])]);
      setCursor(body.nextCursor ?? null);
    } catch {
      setError("Нет связи с сервером.");
    } finally {
      setLoading(false);
    }
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col border border-ink">
        {rows.map((t, idx) => (
          <li
            key={t.id}
            className={idx > 0 ? "border-t border-ink/15" : undefined}
          >
            <TxnRow t={t} />
          </li>
        ))}
      </ul>

      {error ? (
        <p className="border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink">
          {error}
        </p>
      ) : null}

      {cursor ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center self-center border border-ink bg-paper px-6 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          {loading ? "Загружаем…" : `Показать ещё ${pageSize}`}
        </button>
      ) : (
        <p className="self-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          конец истории · показано {rows.length}
        </p>
      )}
    </div>
  );
}

function TxnRow({ t }: { t: PointsTxn }) {
  const isCredit = t.direction === "credit";
  const sign = isCredit ? "+" : "−";
  const dt = new Date(t.createdAt);
  const date = dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
  const time = dt.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[120px_1fr_auto] md:px-6">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] tracking-[0.04em] text-ink">
          {date}
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
          {time}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-medium text-ink">
          {reasonLabel(t.reasonType)}
        </span>
        {t.comment ? (
          <span className="text-[12px] text-muted">{t.comment}</span>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={
            "font-mono text-[16px] font-medium tracking-[0.04em] " +
            (isCredit ? "text-brand-red" : "text-ink")
          }
        >
          {sign}
          {t.amount}&nbsp;Б
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
          → {t.balanceAfter}&nbsp;Б
        </span>
      </div>
    </div>
  );
}
