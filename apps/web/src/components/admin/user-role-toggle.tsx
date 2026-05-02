"use client";

import { useState, useTransition } from "react";
import {
  grantRoleAction,
  revokeRoleAction,
} from "@/app/admin/users/actions";

type RoleCode = "admin" | "partner";

const LABEL: Record<RoleCode, string> = {
  admin: "Admin",
  partner: "Partner",
};

export function UserRoleToggle({
  userId,
  role,
  active,
}: {
  userId: string;
  role: RoleCode;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState(active);

  function toggle() {
    setError(null);
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      const result = next
        ? await grantRoleAction(userId, role)
        : await revokeRoleAction(userId, role);
      if (!result.ok) {
        setOptimistic(active);
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending}
        className={
          "inline-flex h-7 items-center border px-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] disabled:opacity-50 " +
          (optimistic
            ? "border-brand-red bg-brand-red text-paper hover:bg-brand-red-ink"
            : "border-ink/30 bg-paper text-muted hover:border-ink hover:text-ink")
        }
        title={optimistic ? `Снять ${LABEL[role]}` : `Назначить ${LABEL[role]}`}
      >
        {LABEL[role]}
      </button>
      {error ? (
        <span className="font-mono text-[10px] text-brand-red-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}
