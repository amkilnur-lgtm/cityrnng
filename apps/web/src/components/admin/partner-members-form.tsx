"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import {
  addPartnerMemberAction,
  removePartnerMemberAction,
} from "@/app/admin/partners/actions";
import type { AdminPartnerMember } from "@/lib/api-admin";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function PartnerMembersForm({
  partnerId,
  members,
}: {
  partnerId: string;
  members: AdminPartnerMember[];
}) {
  const boundAdd = addPartnerMemberAction.bind(null, partnerId);
  const [state, action] = useFormState(boundAdd, undefined);
  const [pendingRemove, startRemoveTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="type-mono-caps">текущая команда</span>
        {members.length === 0 ? (
          <p className="text-[14px] text-muted">
            Пока никто не привязан. Добавьте email ниже — пользователь сможет
            заходить в&nbsp;<code className="font-mono">/partner</code> и&nbsp;погашать коды.
          </p>
        ) : (
          <ul className="flex flex-col border border-ink">
            {members.map((m, idx) => (
              <li
                key={m.id}
                className={
                  "flex items-center justify-between px-4 py-3 text-[14px] " +
                  (idx > 0 ? "border-t border-ink/15" : "")
                }
              >
                <span className="flex flex-col">
                  <span className="font-mono tracking-[0.04em] text-ink">
                    {m.user.email}
                  </span>
                  <span className="text-[12px] text-muted">
                    {m.user.profile?.displayName ?? "—"}
                    {" · "}
                    добавлен {formatDate(m.createdAt)}
                    {m.user.status === "pending" ? " · ждёт активации" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={pendingRemove}
                  onClick={() =>
                    startRemoveTransition(async () => {
                      await removePartnerMemberAction(partnerId, m.id);
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
        <span className="type-mono-caps">добавить по email</span>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder="bar@partner.com"
            className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] text-ink"
          />
        </label>
        <p className="text-[12px] text-muted">
          Если пользователя ещё нет — будет создан. Логин по обычной magic-link.
        </p>
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
