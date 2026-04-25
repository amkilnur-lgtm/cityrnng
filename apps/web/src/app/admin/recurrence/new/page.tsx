import Link from "next/link";
import { RecurrenceForm } from "@/components/admin/recurrence-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminLocations } from "@/lib/api-admin";
import { createRecurrenceAction } from "../actions";

export const metadata = { title: "Новое правило · Admin · CITYRNNG" };

export default async function NewRecurrencePage() {
  const locations = (await listAdminLocations()).filter(
    (l) => l.status === "active",
  );

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/recurrence"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Расписание
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            Новое правило
          </h1>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <RecurrenceForm
            action={createRecurrenceAction}
            locations={locations}
            submitLabel="Создать правило"
          />
        </Wrap>
      </section>
    </main>
  );
}
