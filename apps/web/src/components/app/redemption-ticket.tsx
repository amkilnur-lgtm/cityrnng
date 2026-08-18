import { QrZoom } from "@/components/app/qr-zoom";

export type TicketView = {
  id: string;
  status: "active" | "used" | "expired" | "cancelled";
  code: string;
  costPoints: number;
  createdAt: string;
  expiresAt: string | null;
  rewardTitle: string;
  partnerName: string;
  partnerLocations: string[];
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

/**
 * Warm redemption "coupon" — a paper ticket (vs the ink identity check-in
 * ticket) with a real scannable QR of the code. Shown for active redemptions;
 * the barista scans the QR at the register.
 */
export function RedemptionTicket({
  ticket,
  svg,
}: {
  ticket: TicketView;
  svg: string;
}) {
  const subtitle =
    ticket.partnerLocations.length > 0
      ? `${ticket.partnerName} · ${ticket.partnerLocations.join(", ")}`
      : ticket.partnerName;

  return (
    <article className="relative flex flex-col overflow-visible rounded-3xl bg-paper-2 ring-1 ring-ink/10">
      {/* "earned" accent edge */}
      <div className="h-1.5 rounded-t-3xl bg-brand-yellow" />

      <div className="flex flex-col gap-3 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow-tint px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6D00]">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
            активен
          </span>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {ticket.partnerName}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="type-h3">{ticket.rewardTitle}</h3>
          <p className="text-[13px] text-graphite">{subtitle}</p>
        </div>

        <QrZoom svg={svg} code={ticket.code}>
          <div
            className="mx-auto rounded-2xl bg-white p-3 [&>svg]:block [&>svg]:h-[132px] [&>svg]:w-[132px]"
            aria-label="QR-код для кассы"
            // eslint-disable-next-line react/no-danger -- trusted, server-generated SVG
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </QrZoom>

        <div className="flex flex-col items-center gap-0.5">
          <span className="select-all text-center font-mono text-[20px] font-semibold tracking-[0.2em] text-ink">
            {ticket.code}
          </span>
          <span className="type-mono-caps">код увидит бариста</span>
        </div>

        <p className="text-center text-[14px] text-graphite">
          Покажи на&nbsp;кассе — бариста отсканирует QR.
        </p>

        {/* Ticket stub — dashed seam + punch-out notches */}
        <div className="relative mt-1 border-t border-dashed border-ink/20 pt-3">
          <span
            aria-hidden
            className="absolute -left-[26px] -top-2 h-4 w-4 rounded-full bg-paper"
          />
          <span
            aria-hidden
            className="absolute -right-[26px] -top-2 h-4 w-4 rounded-full bg-paper"
          />
          <dl className="flex justify-between font-mono text-[12px]">
            <div className="flex flex-col">
              <dt className="text-muted">Списано</dt>
              <dd className="text-ink">−{ticket.costPoints}&nbsp;Б</dd>
            </div>
            {ticket.expiresAt ? (
              <div className="flex flex-col text-right">
                <dt className="text-muted">Действует до</dt>
                <dd className="text-ink">{fmtDate(ticket.expiresAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </article>
  );
}
