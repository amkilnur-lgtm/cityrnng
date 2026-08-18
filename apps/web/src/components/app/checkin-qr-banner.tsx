import Link from "next/link";
import QRCode from "qrcode";
import { QrZoom } from "@/components/app/qr-zoom";
import { Wrap } from "@/components/site/wrap";

/**
 * Runner's personal check-in QR, styled as a warm rounded "ticket" (a pass
 * you hold up at the start). Server-rendered SVG — no client JS, code never
 * leaves our origin. Full fob note lives on /app/profile.
 */
export async function CheckinQrBanner({ code }: { code?: string | null }) {
  if (!code) return null;

  const svg = await QRCode.toString(code, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <Wrap className="py-4">
      <div className="relative flex items-center gap-4 overflow-visible rounded-3xl bg-ink p-4 text-paper md:gap-5 md:p-5">
        {/* Ticket "stub" notches on the seam between QR and text */}
        <span
          aria-hidden
          className="absolute -top-2 left-[104px] h-4 w-4 rounded-full bg-paper-2 md:left-[124px]"
        />
        <span
          aria-hidden
          className="absolute -bottom-2 left-[104px] h-4 w-4 rounded-full bg-paper-2 md:left-[124px]"
        />
        <QrZoom svg={svg} code={code}>
          <div
            className="shrink-0 rounded-2xl bg-white p-2.5 [&>svg]:block [&>svg]:h-[76px] [&>svg]:w-[76px] md:[&>svg]:h-24 md:[&>svg]:w-24"
            aria-label="QR-код для отметки на пробежке"
            // eslint-disable-next-line react/no-danger -- trusted, server-generated SVG
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </QrZoom>
        <div className="flex flex-col gap-1.5 border-l border-dashed border-paper/25 pl-4 md:pl-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-yellow">
            твой код для отметки
          </span>
          <p className="text-[14px] leading-[1.45] text-paper md:text-[15px]">
            Покажи на&nbsp;точке — пробежка засчитана, баллы твои.
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <code className="font-mono text-[12px] tracking-wider text-paper/70">
              {code}
            </code>
            <Link
              href="/app/profile"
              className="font-sans text-[12px] font-medium text-paper/60 underline-offset-4 hover:text-paper hover:underline"
            >
              подробнее →
            </Link>
          </div>
        </div>
      </div>
    </Wrap>
  );
}
