import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { Wrap } from "@/components/site/wrap";
import { createEventAction } from "../actions";

export const metadata = { title: "Новое событие · Admin · CITYRNNG" };

export default function NewEventPage() {
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
            Новое событие
          </h1>
          <p className="type-lede mt-2 max-w-2xl">
            Используй для one-off спецсобытий и&nbsp;замен регулярных сред.
            Регулярные пробежки добавляются через раздел «Расписание».
          </p>
        </Wrap>
      </section>
      <section className="border-b border-ink">
        <Wrap className="max-w-3xl py-10">
          <EventForm
            action={createEventAction}
            submitLabel="Создать событие"
          />
        </Wrap>
      </section>
    </main>
  );
}
