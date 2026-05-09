/** Format integer seconds-per-km as "M:SS" — 330 → "5:30". */
function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type PaceGroup = {
  id: string;
  distanceKm: number;
  paceSecondsPerKm: number;
  pacerName: string | null;
};

type Location = {
  id: string;
  name: string;
  paceGroups?: PaceGroup[];
};

/**
 * Public read-only display of available pace groups per starting location.
 * Empty per location means "no pacers — пробежка по самочувствию".
 */
export function PaceGroupsDisplay({ locations }: { locations: Location[] }) {
  const hasAny = locations.some(
    (l) => (l.paceGroups?.length ?? 0) > 0,
  );
  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-3">
      <span className="type-mono-caps">пейс-группы</span>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="flex flex-col gap-2 border border-ink/30 p-4"
          >
            <span className="font-sans text-[13px] font-semibold text-ink">
              {loc.name}
            </span>
            {loc.paceGroups && loc.paceGroups.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {loc.paceGroups.map((pg) => (
                  <li
                    key={pg.id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="font-mono tracking-[0.04em] text-ink">
                      {pg.distanceKm}&nbsp;км · {formatPace(pg.paceSecondsPerKm)}
                    </span>
                    {pg.pacerName ? (
                      <span className="text-[12px] text-muted">
                        {pg.pacerName}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[12px] text-muted">
                Без пейсера — темп по самочувствию
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
