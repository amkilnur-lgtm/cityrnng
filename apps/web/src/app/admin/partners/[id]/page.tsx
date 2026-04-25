import Link from "next/link";
import { notFound } from "next/navigation";
import { PartnerForm } from "@/components/admin/partner-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminPartners } from "@/lib/api-admin";
import { updatePartnerAction } from "../actions";

export const metadata = { title: "Партнёр · Admin · CITYRNNG" };

export default async function EditPartnerPage({
  params,
}: {
  params: { id: string };
}) {
  const partners = await listAdminPartners();
  const partner = partners.find((p) => p.id === params.id);
  if (!partner) notFound();

  const boundUpdate = updatePartnerAction.bind(null, params.id);

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/partners"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Партнёры
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            {partner.name}
          </h1>
          <p className="mt-2 font-mono text-[13px] tracking-[0.04em] text-muted">
            {partner.slug}
          </p>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <PartnerForm
            action={boundUpdate}
            defaults={{
              slug: partner.slug,
              name: partner.name,
              description: partner.description,
              contactEmail: partner.contactEmail,
              status: partner.status,
            }}
            submitLabel="Сохранить"
          />
        </Wrap>
      </section>
    </main>
  );
}
