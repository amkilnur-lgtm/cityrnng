import Link from "next/link";
import { RewardForm } from "@/components/admin/reward-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminPartners } from "@/lib/api-admin";
import { createRewardAction } from "../actions";

export const metadata = { title: "Новая награда · Admin · CITYRNNG" };

export default async function NewRewardPage() {
  const partners = await listAdminPartners();
  const activePartners = partners.filter((p) => p.status === "active");

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
            Новая награда
          </h1>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <RewardForm
            action={createRewardAction}
            partners={activePartners}
            submitLabel="Создать награду"
          />
        </Wrap>
      </section>
    </main>
  );
}
