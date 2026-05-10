import Link from "next/link";
import { notFound } from "next/navigation";
import { Wrap } from "@/components/site/wrap";
import { Badge } from "@/components/ui/badge";
import { RedemptionCancelForm } from "@/components/admin/redemption-cancel-form";
import { listRedemptionsAdmin } from "@/lib/api-rewards";
import { cancelRedemptionAction } from "../../actions";

export const metadata = { title: "Отмена обмена · Admin · CITYRNNG" };

export default async function CancelRedemptionPage({
  params,
}: {
  params: { id: string };
}) {
  // No single-fetch endpoint — pull recent and find by id. With take=200
  // we cover plenty for an admin tool; a dedicated GET /:id can come later.
  const recent = await listRedemptionsAdmin({});
  const redemption = recent.find((r) => r.id === params.id);
  if (!redemption) notFound();

  const boundCancel = cancelRedemptionAction.bind(null, redemption.id);

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/redemptions"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Обмены
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            Отменить обмен.
          </h1>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="grid max-w-3xl grid-cols-1 gap-6 py-10 md:grid-cols-[1fr_auto] md:items-start">
          <div className="flex flex-col gap-2 border border-ink bg-paper p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="font-mono text-[16px] font-semibold uppercase tracking-[0.16em] text-ink">
                {redemption.code}
              </span>
              <Badge
                variant={redemption.status === "active" ? "primary" : "default"}
              >
                {redemption.status}
              </Badge>
            </div>
            <p className="font-sans text-[15px] font-semibold text-ink">
              {redemption.reward.title}
            </p>
            <p className="text-[13px] text-graphite">
              {redemption.reward.partner.name} ·{" "}
              <span className="font-mono text-brand-red">
                {redemption.costPoints}&nbsp;Б
              </span>{" "}
              будут возвращены пользователю
            </p>
            <p className="font-mono text-[12px] text-muted">
              {redemption.user.email}
            </p>
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="max-w-3xl py-10">
          <RedemptionCancelForm action={boundCancel} />
        </Wrap>
      </section>
    </main>
  );
}
