"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import {
  addPaceGroupAction,
  deletePaceGroupAction,
} from "@/app/admin/locations/actions";
import type { AdminPaceGroup } from "@/lib/api-admin";

function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PaceGroupsForm({
  locationId,
  groups,
}: {
  locationId: string;
  groups: AdminPaceGroup[];
}) {
  const boundAdd = addPaceGroupAction.bind(null, locationId);
  const [state, action] = useFormState(boundAdd, undefined);
  const [pendingDelete, startDeleteTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="type-mono-caps">текущие группы</span>
        {groups.length === 0 ? (
          <p className="text-[14px] text-muted">Пока ничего не настроено.</p>
        ) : (
          <ul className="flex flex-col border border-ink">
            {groups.map((g, idx) => (
              <li
                key={g.id}
                className={
                  "flex items-center justify-between px-4 py-3 text-[14px] " +
                  (idx > 0 ? "border-t border-ink/15" : "")
                }
              >
                <span className="font-mono tracking-[0.04em] text-ink">
                  {g.distanceKm}&nbsp;км · {formatPace(g.paceSecondsPerKm)}
                  {g.pacerName ? (
                    <span className="ml-3 text-muted">{g.pacerName}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={pendingDelete}
                  onClick={() =>
                    startDeleteTransition(async () => {
                      await deletePaceGroupAction(locationId, g.id);
                    })
                  }
                  className="font-sans text-[12px] font-medium text-muted underline-offset-4 hover:text-brand-red hover:underline disabled:opacity-50"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={action} className="flex flex-col gap-3 border border-ink p-4">
        <span className="type-mono-caps">добавить группу</span>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Дистанция (км)
            </span>
            <input
              name="distanceKm"
              type="number"
              min={1}
              max={100}
              required
              defaultValue={5}
              className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Темп (M:SS)
            </span>
            <input
              name="pace"
              type="text"
              required
              placeholder="5:30"
              pattern="\d+:\d{2}"
              className="h-11 border border-ink bg-paper px-3 font-mono text-[14px] tracking-[0.04em] text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Пейсер (опц.)
            </span>
            <input
              name="pacerName"
              type="text"
              maxLength={120}
              placeholder="Имя"
              className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] text-ink"
            />
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center self-start border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
        >
          Добавить
        </button>
        {state && !state.ok ? (
          <p role="alert" className="text-[13px] text-brand-red-ink">
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
