import QRCode from "qrcode";
import { QrZoom } from "@/components/app/qr-zoom";

/**
 * Personal check-in QR shown in the runner cabinet. Renders the static code as
 * an inline SVG on the server (no client JS, code never leaves our origin).
 * The same code can be printed on a physical fob — scanning either at a
 * runbase credits the run.
 */
export async function CheckinQrCard({ code }: { code?: string | null }) {
  if (!code) {
    return (
      <div className="flex flex-col gap-4 border border-ink bg-paper-2 p-6 md:p-8">
        <span className="type-mono-caps">qr-код</span>
        <h3 className="type-h3">Код появится после входа</h3>
        <p className="text-[15px] leading-[1.55] text-graphite">
          Зайди в&nbsp;аккаунт по&nbsp;ссылке из&nbsp;письма — и&nbsp;здесь
          появится твой персональный QR для&nbsp;отметки на&nbsp;пробежке.
        </p>
      </div>
    );
  }

  const svg = await QRCode.toString(code, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <div className="flex flex-col gap-4 border border-ink bg-paper p-6 md:p-8">
      <div className="flex items-center gap-2">
        <span className="block h-2 w-2 bg-brand-red" aria-hidden />
        <span className="type-mono-caps text-brand-red">твой qr для отметки</span>
      </div>
      <h3 className="type-h3">Отмечайся на&nbsp;пробежке</h3>
      <p className="text-[15px] leading-[1.55] text-graphite">
        Приходи на&nbsp;точку сбора и&nbsp;поднеси этот QR к&nbsp;сканеру —
        с&nbsp;телефона или с&nbsp;брелока. Пробежка засчитана, баллы начислены.
      </p>

      <div className="flex flex-col items-center gap-3 self-start">
        <QrZoom svg={svg} code={code}>
          <div
            className="border border-ink bg-white p-3 [&>svg]:block [&>svg]:h-44 [&>svg]:w-44"
            aria-label="QR-код для отметки на пробежке"
            // eslint-disable-next-line react/no-danger -- trusted, server-generated SVG
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </QrZoom>
        <code className="font-mono text-[13px] tracking-wider text-ink">{code}</code>
      </div>

      <p className="text-[12px] leading-[1.5] text-muted">
        Код персональный — не&nbsp;передавай его другим. Хочешь брелок? Скажи
        на&nbsp;точке, мы&nbsp;нанесём этот же&nbsp;код.
      </p>
    </div>
  );
}
