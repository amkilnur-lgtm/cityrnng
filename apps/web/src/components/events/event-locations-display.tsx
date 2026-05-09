import type {
  EventLocation,
  EventPaceGroup,
} from "@/components/events/event-rsvp";

function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  locations: EventLocation[];
  countsByLocation: Record<string, number>;
  /** Highlights the location this user has already RSVPed to (optional). */
  myLocationId?: string | null;
};

/**
 * Read-only sibling of EventRsvp — same card grid + pace groups, no submit
 * controls. Used on the public event detail page where RSVP itself lives
 * on /app.
 */
export function EventLocationsDisplay({
  locations,
  countsByLocation,
  myLocationId = null,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <span className="type-mono-caps">точки старта</span>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {locations.map((loc) => {
          const count = countsByLocation[loc.id] ?? 0;
          const isMine = myLocationId === loc.id;
          const accent = isMine
            ? "border-brand-red/50 bg-brand-tint/40"
            : "border-ink/30 bg-paper";
          return (
            <li key={loc.id}>
              <div
                className={`flex h-full w-full flex-col gap-3 border p-4 ${accent}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-sans text-[15px] font-semibold leading-tight text-ink">
                    {loc.name}
                  </span>
                  <span className="whitespace-nowrap font-mono text-[11px] tracking-[0.04em] text-muted">
                    {count > 0 ? (
                      <>
                        <span className="text-brand-red">●</span>{" "}
                        {count}&nbsp;идут
                      </>
                    ) : (
                      "будь первым"
                    )}
                  </span>
                </div>
                {loc.paceGroups && loc.paceGroups.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {loc.paceGroups.map((pg: EventPaceGroup) => (
                      <li
                        key={pg.id}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="font-mono tracking-[0.02em] text-ink">
                          {pg.distanceKm}&nbsp;км ·{" "}
                          {formatPace(pg.paceSecondsPerKm)}
                        </span>
                        {pg.pacerName ? (
                          <span className="truncate text-[12px] text-muted">
                            с {pg.pacerName}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[12px] leading-tight text-muted">
                    Без пейсера — темп по&nbsp;самочувствию
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
