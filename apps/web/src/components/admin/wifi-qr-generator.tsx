"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { QrZoom } from "@/components/app/qr-zoom";

type AuthType = "WPA" | "nopass";

/** Escapes `\`, `;`, `,`, `:` per the WIFI: QR field spec. */
function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:])/g, "\\$1");
}

function buildWifiPayload(ssid: string, password: string, authType: AuthType): string {
  const s = escapeWifiField(ssid);
  if (authType === "nopass") {
    return `WIFI:T:nopass;S:${s};;`;
  }
  return `WIFI:T:WPA;S:${s};P:${escapeWifiField(password)};;`;
}

/**
 * Generates a client-side-only "connect to this Wi-Fi" QR for the runbase
 * scanner to read (see devices/runbase-scanner/scanner.py — it recognizes
 * the WIFI: prefix and configures nmcli instead of posting a check-in).
 * SSID/password never leave the browser — no server round-trip, nothing
 * logged or stored.
 */
export function WifiQrGenerator() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [authType, setAuthType] = useState<AuthType>("WPA");
  const [svg, setSvg] = useState<string | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ssid.trim()) {
      setError("Укажи SSID.");
      return;
    }
    if (authType === "WPA" && !password) {
      setError("Укажи пароль или выбери «без пароля».");
      return;
    }
    const text = buildWifiPayload(ssid.trim(), password, authType);
    try {
      const out = await QRCode.toString(text, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      setSvg(out);
      setPayload(text);
    } catch {
      setError("Не удалось сгенерировать QR.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={generate} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="type-label">SSID</span>
            <input
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="TP-Link_D92C"
              className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="type-label">Пароль</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={authType === "nopass"}
              placeholder="••••••••"
              className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="type-label">Тип</span>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)}
              className="h-11 border border-ink bg-paper px-3 font-sans text-[14px] outline-none c3-focus"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="nopass">без пароля</option>
            </select>
          </label>
        </div>

        <p
          role="alert"
          aria-live="polite"
          className={
            error
              ? "border border-brand-red bg-brand-tint/50 px-3 py-2 text-[13px] text-brand-red-ink"
              : "sr-only"
          }
        >
          {error ?? ""}
        </p>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center self-start border border-brand-red bg-brand-red px-6 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink"
        >
          Сгенерировать QR
        </button>
      </form>

      {svg && payload ? (
        <div className="flex flex-col items-start gap-3 border border-ink bg-paper-2 p-6 md:p-8">
          <span className="type-mono-caps text-brand-red">
            поднеси к сканеру
          </span>
          <QrZoom svg={svg} code={payload}>
            <div
              className="border border-ink bg-white p-3 [&>svg]:block [&>svg]:h-44 [&>svg]:w-44"
              aria-label="QR для настройки Wi-Fi на сканере"
              // eslint-disable-next-line react/no-danger -- trusted, browser-generated SVG
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </QrZoom>
          <p className="max-w-md text-[12px] leading-[1.5] text-muted">
            SSID и пароль не уходят на сервер — QR собран прямо в браузере.
            Закрой вкладку после настройки, ничего не сохраняется.
          </p>
        </div>
      ) : null}
    </div>
  );
}
