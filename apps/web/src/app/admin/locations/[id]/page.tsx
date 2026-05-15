import Link from "next/link";
import { notFound } from "next/navigation";
import { LocationForm } from "@/components/admin/location-form";
import { PaceGroupsForm } from "@/components/admin/pace-groups-form";
import { Wrap } from "@/components/site/wrap";
import { listAdminLocations, listAdminPaceGroups } from "@/lib/api-admin";
import { updateLocationAction } from "../actions";

export const metadata = { title: "Локация · Admin · CITYRNNG" };

export default async function EditLocationPage({
  params,
}: {
  params: { id: string };
}) {
  const [locations, paceGroups] = await Promise.all([
    listAdminLocations(),
    listAdminPaceGroups(params.id),
  ]);
  const loc = locations.find((l) => l.id === params.id);
  if (!loc) notFound();

  const boundUpdate = updateLocationAction.bind(null, params.id);

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <Link
            href="/admin/locations"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-brand-red"
          >
            ← Локации
          </Link>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            {loc.name}
          </h1>
          <p className="mt-2 font-mono text-[13px] tracking-[0.04em] text-muted">
            {loc.slug} · {loc.city}
          </p>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <LocationForm
            action={boundUpdate}
            defaults={{
              slug: loc.slug,
              name: loc.name,
              city: loc.city,
              venue: loc.venue,
              address: loc.address,
              lat: loc.lat,
              lng: loc.lng,
              radiusMeters: loc.radiusMeters,
              status: loc.status,
            }}
            submitLabel="Сохранить"
          />
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <h2 className="type-h3 mb-4">Пейс-группы</h2>
          <p className="mb-4 max-w-prose text-[13px] text-graphite">
            Доступные на&nbsp;этой точке темпы — отображаются на&nbsp;странице
            каждого регулярного ситираннинга, который стартует отсюда.
          </p>
          <PaceGroupsForm locationId={params.id} groups={paceGroups} />
        </Wrap>
      </section>
    </main>
  );
}
