import { WifiQrGenerator } from "@/components/admin/wifi-qr-generator";
import { Wrap } from "@/components/site/wrap";

export const metadata = { title: "Wi-Fi QR для сканера · Admin · CITYRNNG" };

export default function AdminWifiQrPage() {
  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="flex flex-col gap-2 py-10">
          <span className="type-mono-caps">qr-зачёт · настройка wi-fi на малине</span>
          <h1 className="type-h-admin">Wi-Fi <em className="not-italic text-brand-red">QR</em></h1>
          <p className="max-w-2xl text-[14px] leading-[1.55] text-graphite">
            Впиши SSID и пароль сети, к которой должен подключиться сканер на
            точке, сгенерируй QR и поднеси его к USB-сканеру или камере
            малины — она распознает формат{" "}
            <code className="font-mono">WIFI:...</code> и настроит сеть сама,
            без клавиатуры и монитора.
          </p>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-8">
          <div className="border border-ink bg-paper-2 p-6 md:p-8">
            <WifiQrGenerator />
          </div>
        </Wrap>
      </section>
    </main>
  );
}
