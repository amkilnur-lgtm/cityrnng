import Link from "next/link";
import { listMyMemberships } from "@/lib/api-partner";

/**
 * Видимая карточка «Партнёрский кабинет» на /app/profile. Показывается
 * только при наличии хотя бы одного PartnerMember у юзера — иначе пустой
 * `<></>` (а саму карточку condition'ом не рендерим в profile/page.tsx).
 */
export async function PartnerCabinetCard() {
  const memberships = await listMyMemberships();
  if (memberships.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-2 border-brand-red bg-brand-tint/20 p-6">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-red-ink">
        партнёрский кабинет
      </span>
      <p className="text-[15px] leading-snug text-ink">
        Ты сотрудник{" "}
        {memberships.length === 1 ? (
          <strong className="font-semibold">{memberships[0].partnerName}</strong>
        ) : (
          <>
            <strong className="font-semibold">{memberships.length}</strong>{" "}
            заведений: {memberships.map((m) => m.partnerName).join(", ")}
          </>
        )}
        . Можешь гасить клиентские коды и&nbsp;смотреть историю погашений.
      </p>
      <Link
        href="/partner"
        className="inline-flex h-11 w-fit items-center gap-2 border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
      >
        Открыть кабинет →
      </Link>
    </div>
  );
}
