import Link from "next/link";
import QRCode from "qrcode";

/**
 * Compact check-in QR shown at the very top of the dashboard — first thing a
 * runner sees after login. Full card with the fob note lives on /app/profile.
 * Server-rendered SVG (no client JS, code never leaves our origin).
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
    <section className="border-b border-ink bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 py-5 md:gap-6 md:px-8">
        <div
          className="shrink-0 border border-paper/20 bg-white p-2 [&>svg]:block [&>svg]:h-24 [&>svg]:w-24 md:[&>svg]:h-28 md:[&>svg]:w-28"
          aria-label="QR-код для отметки на пробежке"
          // eslint-disable-next-line react/no-danger -- trusted, server-generated SVG
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-red">
            твой qr для отметки
          </span>
          <p className="text-[14px] leading-[1.5] text-paper md:text-[15px]">
            Покажи на&nbsp;точке сбора — пробежка засчитана, баллы начислены.
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <code className="font-mono text-[12px] tracking-wider text-paper/80">
              {code}
            </code>
            <Link
              href="/app/profile"
              className="font-sans text-[12px] font-medium text-paper/70 underline-offset-4 hover:text-paper hover:underline"
            >
              подробнее →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
