import Link from "next/link";
import { notFound } from "next/navigation";
import { RecurrenceForm } from "@/components/admin/recurrence-form";
import { Wrap } from "@/components/site/wrap";
import {
  listAdminLocations,
  listAdminRecurrenceRules,
} from "@/lib/api-admin";
import { updateRecurrenceAction } from "../actions";

export const metadata = { title: "Правило · Admin · CITYRNNG" };

export default async function EditRecurrencePage({
  params,
}: {
  params: { id: string };
}) {
  const [rules, locations] = await Promise.all([
    listAdminRecurrenceRules(),
    listAdminLocations().then((all) => all.filter((l) => l.status === "active")),
  ]);
  const rule = rules.find((r) => r.id === params.id);
  if (!rule) notFound();

  const boundUpdate = updateRecurrenceAction.bind(null, params.id);

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
            {rule.title}
          </h1>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <RecurrenceForm
            action={boundUpdate}
            locations={locations}
            submitLabel="Сохранить"
            defaults={{
              title: rule.title,
              type: rule.type,
              status: rule.status,
              dayOfWeek: rule.dayOfWeek,
              timeOfDay: rule.timeOfDay,
              durationMinutes: rule.durationMinutes,
              isPointsEligible: rule.isPointsEligible,
              basePointsAward: rule.basePointsAward,
              startsFromDate: rule.startsFromDate,
              endsAtDate: rule.endsAtDate,
              selectedLocationIds: rule.locations.map((rl) => rl.locationId),
            }}
          />
        </Wrap>
      </section>
    </main>
  );
}
