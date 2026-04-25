import Link from "next/link";
import { PartnerForm } from "@/components/admin/partner-form";
import { Wrap } from "@/components/site/wrap";
import { createPartnerAction } from "../actions";

export const metadata = { title: "Новый партнёр · Admin · CITYRNNG" };

export default function NewPartnerPage() {
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
            Новый партнёр
          </h1>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <PartnerForm
            action={createPartnerAction}
            submitLabel="Создать партнёра"
          />
        </Wrap>
      </section>
    </main>
  );
}
