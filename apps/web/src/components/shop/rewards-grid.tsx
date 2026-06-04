"use client";

import Link from "next/link";
import { useState } from "react";

export type RewardView = {
  slug: string;
  partnerSlug: string;
  title: string;
  description: string | null;
  costPoints: number;
  badge: string | null;
};

const MOBILE_PREVIEW_COUNT = 2;

export function RewardsGrid({
  rewards,
  isAuthed,
  userPoints,
}: {
  rewards: RewardView[];
  isAuthed: boolean;
  userPoints: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hidden = rewards.length - MOBILE_PREVIEW_COUNT;
  const showToggle = hidden > 0;

  return (
    <>
      <div className="grid grid-cols-1 border border-ink md:grid-cols-2 lg:grid-cols-4">
        {rewards.map((reward, i) => {
          // Карточки после второй скрыты на мобайле до раскрытия. На md+
          // (планшет и шире) сетка уже двух/четырёхколонная, всё видно сразу.
          const hideOnMobile = !expanded && i >= MOBILE_PREVIEW_COUNT;
          return (
            <RewardCard
              key={reward.slug}
              reward={reward}
              index={i}
              isAuthed={isAuthed}
              userPoints={userPoints}
              hideOnMobile={hideOnMobile}
            />
          );
        })}
      </div>

      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex h-11 w-full items-center justify-center px-5 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-brand-red md:hidden"
          aria-expanded={expanded}
        >
          {expanded
            ? "Свернуть ↑"
            : `Ещё ${hidden} ${pluralRu(hidden, "товар", "товара", "товаров")} ↓`}
        </button>
      ) : null}
    </>
  );
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function RewardCard({
  reward,
  index,
  isAuthed,
  userPoints,
  hideOnMobile,
}: {
  reward: RewardView;
  index: number;
  isAuthed: boolean;
  userPoints: number;
  hideOnMobile: boolean;
}) {
  const canAfford = isAuthed && userPoints >= reward.costPoints;
  const insufficient = isAuthed && !canAfford;

  const borderClasses = [
    index > 0 && "border-t border-ink/15",
    index % 2 === 1 && "md:border-l md:border-ink",
    index >= 2 && "md:border-t md:border-ink/15",
    index % 4 !== 0 && "lg:border-l lg:border-ink",
    "lg:border-t-0",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={
        `flex flex-col gap-3 p-5 md:p-6 ${borderClasses} ` +
        (hideOnMobile ? "hidden md:flex" : "")
      }
    >
      {reward.badge ? (
        <span className="self-start font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-brand-red">
          {reward.badge}
        </span>
      ) : null}
      <h3 className="type-h3">{reward.title}</h3>
      {reward.description ? (
        <p className="text-[13px] leading-[1.5] text-graphite">
          {reward.description}
        </p>
      ) : null}
      <div className="mt-auto flex items-center justify-between border-t border-ink/15 pt-3">
        <span
          className={
            "font-mono text-[16px] font-medium tracking-[0.04em] " +
            (insufficient ? "text-muted" : "text-brand-red")
          }
        >
          {reward.costPoints}&nbsp;Б
        </span>
        {!isAuthed ? (
          <Link
            href="/auth"
            className="font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
          >
            Войти →
          </Link>
        ) : insufficient ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            не хватает {reward.costPoints - userPoints}&nbsp;Б
          </span>
        ) : (
          <Link
            href={`/shop/${reward.slug}`}
            className="font-sans text-[13px] font-semibold text-ink hover:text-brand-red"
          >
            Обменять →
          </Link>
        )}
      </div>
    </article>
  );
}
