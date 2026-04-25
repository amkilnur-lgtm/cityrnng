import Link from "next/link";
import { LocationForm } from "@/components/admin/location-form";
import { Wrap } from "@/components/site/wrap";
import { createLocationAction } from "../actions";

export const metadata = { title: "Новая локация · Admin · CITYRNNG" };

export default function NewLocationPage() {
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
            Новая локация
          </h1>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-2xl py-10">
          <LocationForm
            action={createLocationAction}
            submitLabel="Создать локацию"
          />
        </Wrap>
      </section>
    </main>
  );
}
