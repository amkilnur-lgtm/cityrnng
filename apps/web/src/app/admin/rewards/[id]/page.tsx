import Link from "next/link";
import { notFound } from "next/navigation";
import { RewardForm } from "@/components/admin/reward-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminPartners, listAdminRewards } from "@/lib/api-admin";
import { updateRewardAction } from "../actions";

export const metadata = { title: "Награда · Admin · CITYRNNG" };

export default async function EditRewardPage({
  params,
}: {
  params: { id: string };
}) {
  const [rewards, partners] = await Promise.all([
    listAdminRewards(),
    listAdminPartners(),
  ]);
  const reward = rewards.find((r) => r.id === params.id);
  if (!reward) notFound();

  const boundUpdate = updateRewardAction.bind(null, params.id);

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/rewards"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Награды
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            {reward.title}
          </h1>
          <p className="mt-2 font-mono text-[13px] tracking-[0.04em] text-muted">
            {reward.partner.name} · {reward.slug} · {reward.costPoints}&nbsp;Б
          </p>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <RewardForm
            action={boundUpdate}
            partners={partners}
            defaults={{
              slug: reward.slug,
              partnerId: reward.partnerId,
              title: reward.title,
              description: reward.description,
              costPoints: reward.costPoints,
              badge: reward.badge,
              status: reward.status,
              validFrom: reward.validFrom,
              validUntil: reward.validUntil,
              capacity: reward.capacity,
            }}
            submitLabel="Сохранить"
          />
        </Wrap>
      </section>
    </main>
  );
}
