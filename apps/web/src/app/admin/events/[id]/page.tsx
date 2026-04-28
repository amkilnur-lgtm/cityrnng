import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminEvents } from "@/lib/api-admin";
import { updateEventAction } from "../actions";

export const metadata = { title: "Событие · Admin · CITYRNNG" };

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const events = await listAdminEvents();
  const event = events.find((e) => e.id === params.id);
  if (!event) notFound();

  const boundUpdate = updateEventAction.bind(null, params.id);

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/events"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← События
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            {event.title}
          </h1>
          <p className="mt-2 font-mono text-[13px] tracking-[0.04em] text-muted">
            {event.slug} · {event.type} · {event.status}
            {event.recurrenceRuleId ? (
              <>
                {" · "}
                <span className="text-brand-red">override</span>
              </>
            ) : null}
          </p>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-3xl py-10">
          <EventForm
            action={boundUpdate}
            defaults={{
              title: event.title,
              slug: event.slug,
              description: event.description,
              type: event.type,
              status: event.status,
              startsAt: event.startsAt,
              endsAt: event.endsAt,
              locationName: event.locationName,
              locationAddress: event.locationAddress,
              locationLat: event.locationLat,
              locationLng: event.locationLng,
              capacity: event.capacity,
              registrationOpenAt: event.registrationOpenAt,
              registrationCloseAt: event.registrationCloseAt,
              isPointsEligible: event.isPointsEligible,
              basePointsAward: event.basePointsAward,
            }}
            submitLabel="Сохранить"
          />
        </Wrap>
      </section>
    </main>
  );
}
