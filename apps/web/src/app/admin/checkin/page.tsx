import { ScanDeviceCreateForm } from "@/components/admin/scan-device-create-form";
import { ScanDeviceRowActions } from "@/components/admin/scan-device-row-actions";
import { Wrap } from "@/components/site/wrap";
import { listAdminLocations } from "@/lib/api-admin";
import {
  type CheckinScanResult,
  listCheckinScans,
  listScanDevices,
} from "@/lib/api-admin-checkin";
import { pluralRu } from "@/lib/plural";

export const metadata = { title: "Сканеры · Admin · CITYRNNG" };

const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

const RESULT_LABEL: Record<CheckinScanResult, string> = {
  matched: "засчитано",
  duplicate: "повтор",
  no_window: "нет пробежки",
  unknown_code: "код не распознан",
  error: "ошибка",
};

const RESULT_TONE: Record<CheckinScanResult, string> = {
  matched: "border-ink bg-ink text-paper",
  duplicate: "border-ink/30 text-muted",
  no_window: "border-ink/30 text-muted",
  unknown_code: "border-brand-red text-brand-red",
  error: "border-brand-red text-brand-red",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${RU_MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function AdminCheckinPage() {
  const [devices, locations, scans] = await Promise.all([
    listScanDevices(),
    listAdminLocations(),
    listCheckinScans(),
  ]);
  const activeLocations = locations
    .filter((l) => l.status === "active")
    .map((l) => ({ id: l.id, name: l.name, city: l.city }));

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col gap-2 py-10">
          <span className="type-mono-caps">qr-зачёт · сканеры на точках</span>
          <h1 className="type-h-admin">
            {devices.length}{" "}
            <em className="not-italic text-brand-red">
              {pluralRu(devices.length, "сканер", "сканера", "сканеров")}
            </em>
          </h1>
          <p className="max-w-2xl text-[14px] leading-[1.55] text-graphite">
            Сканер стоит на&nbsp;точке сбора и&nbsp;шлёт сканы QR на&nbsp;сайт.
            Каждый привязан к&nbsp;точке и&nbsp;аутентифицируется ключом
            (заголовок <code className="font-mono">X-Device-Key</code>). Ключ
            показываем один раз при создании.
          </p>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          <h2 className="type-h3 mb-4">Новый сканер</h2>
          <div className="border border-ink bg-paper-2 p-6 md:p-8">
            <ScanDeviceCreateForm locations={activeLocations} />
          </div>
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          <h2 className="type-h3 mb-1">Сканеры</h2>
          <p className="mb-4 max-w-2xl text-[13px] leading-[1.5] text-graphite">
            «Тест-скан» в строке устройства прогоняет checkin-код бегуна через
            тот же путь, что и реальная малина — без физического сканера. Свой
            код бегун найдёт в&nbsp;<code className="font-mono">/app/profile</code>.
          </p>
          {devices.length === 0 ? (
            <Empty text="Сканеров пока нет — создай первый формой выше." />
          ) : (
            <div className="overflow-x-auto border border-ink">
              <table className="w-full min-w-[760px] text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Название</Th>
                    <Th>Точка</Th>
                    <Th>Статус</Th>
                    <Th>На связи</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d, idx) => (
                    <tr
                      key={d.id}
                      className={idx > 0 ? "border-t border-ink/15" : ""}
                    >
                      <Td>
                        <div className="font-medium text-ink">{d.label}</div>
                      </Td>
                      <Td>
                        <div className="text-ink">{d.locationName}</div>
                        <div className="font-mono text-[11px] text-muted">
                          {d.locationCity}
                        </div>
                      </Td>
                      <Td>
                        <span
                          className={
                            "inline-flex h-6 items-center border px-2 font-mono text-[10px] uppercase tracking-[0.14em] " +
                            (d.status === "active"
                              ? "border-ink bg-ink text-paper"
                              : "border-ink/30 text-muted")
                          }
                        >
                          {d.status === "active" ? "активен" : "выключен"}
                        </span>
                      </Td>
                      <Td mono>{d.lastSeenAt ? fmt(d.lastSeenAt) : "—"}</Td>
                      <Td className="text-right">
                        <ScanDeviceRowActions
                          id={d.id}
                          label={d.label}
                          status={d.status}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Wrap>
      </section>

      <section className="border-b border-ink">
        <Wrap className="py-8">
          <h2 className="type-h3 mb-4">Последние сканы</h2>
          {scans.length === 0 ? (
            <Empty text="Сканов ещё не было. Как только сканер пришлёт первый скан — появится здесь." />
          ) : (
            <div className="overflow-x-auto border border-ink">
              <table className="w-full min-w-[820px] text-[14px]">
                <thead className="border-b border-ink bg-paper-2/40 text-left">
                  <tr>
                    <Th>Когда</Th>
                    <Th>Результат</Th>
                    <Th>Бегун</Th>
                    <Th>Сканер · точка</Th>
                    <Th>Событие</Th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={idx > 0 ? "border-t border-ink/15" : ""}
                    >
                      <Td mono>{fmt(s.scannedAt)}</Td>
                      <Td>
                        <span
                          className={
                            "inline-flex h-6 items-center border px-2 font-mono text-[10px] uppercase tracking-[0.14em] " +
                            RESULT_TONE[s.result]
                          }
                        >
                          {RESULT_LABEL[s.result]}
                        </span>
                      </Td>
                      <Td>
                        {s.runner ? (
                          <>
                            <div className="text-[13px] text-ink">
                              {s.runner.displayName ?? s.runner.email}
                            </div>
                            <div className="font-mono text-[11px] text-muted">
                              {s.runner.email}
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-[12px] text-muted">
                            {s.checkinCode}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <div className="text-ink">{s.deviceLabel}</div>
                        <div className="font-mono text-[11px] text-muted">
                          {s.locationName}
                        </div>
                      </Td>
                      <Td>
                        {s.eventTitle ? (
                          <div className="text-[13px] text-ink">
                            {s.eventTitle}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Wrap>
      </section>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-8">
      <span className="type-mono-caps">пусто</span>
      <p className="max-w-xl text-[14px] leading-[1.55] text-graphite">{text}</p>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
  className,
}: {
  children?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={
        "px-4 py-3 align-top " +
        (mono ? "font-mono text-[13px] tracking-[0.04em] " : "") +
        (className ?? "")
      }
    >
      {children}
    </td>
  );
}
