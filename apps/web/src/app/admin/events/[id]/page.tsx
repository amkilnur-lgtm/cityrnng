import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminEvents, listAdminLocations } from "@/lib/api-admin";
import { getPublicEvent } from "@/lib/api-events";
import { updateEventAction } from "../actions";

export const metadata = { title: "Событие · Admin · CITYRNNG" };

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const [events, locations, publicView] = await Promise.all([
    listAdminEvents(),
    listAdminLocations(),
    getPublicEvent(params.id),
  ]);
  const event = events.find((e) => e.id === params.id);
  if (!event) notFound();

  const boundUpdate = updateEventAction.bind(null, params.id);
  // Standalone event (no recurrence parent) with no sync-rule locations =
  // public page hides the RSVP block silently. Warn the admin so they don't
  // ship a published event with no way to register.
  const hasInheritedLocations = event.recurrenceRuleId != null;
  const attachedLocationIds =
    publicView?.syncRule?.locations.map((l) => l.id) ?? [];
  const hasOwnLocations = attachedLocationIds.length > 0;
  const showNoLocationsWarning = !hasInheritedLocations && !hasOwnLocations;

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
          <h1 className="type-h-admin-sub mt-3">
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
      {showNoLocationsWarning ? (
        <section className="border-b border-ink bg-brand-tint/40">
          <Wrap className="py-5">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-red-ink">
              ⚠ Локации не назначены
            </p>
            <p className="mt-2 text-[14px] text-ink">
              К&nbsp;событию не&nbsp;привязана ни&nbsp;одна точка старта —
              на&nbsp;публичной странице кнопка «Я&nbsp;иду» не&nbsp;покажется.
              Привязать локации сейчас можно через API:{" "}
              <code className="bg-paper px-1.5 py-0.5 font-mono text-[12px] text-ink">
                PUT /admin/events/{params.id}/sync-rules
              </code>
            </p>
          </Wrap>
        </section>
      ) : null}
      <section className="border-b border-ink">
        <Wrap className="max-w-3xl py-10">
          <EventForm
            action={boundUpdate}
            defaults={{
              title: event.title,
              slug: event.slug,
              description: event.description,
              distanceLabel: event.distanceLabel,
              excludesRegularLocationIds: event.excludesRegularLocationIds,
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
            locations={locations.filter((l) => l.status === "active")}
            defaultLocationIds={attachedLocationIds}
            submitLabel="Сохранить"
          />
        </Wrap>
      </section>
    </main>
  );
}
