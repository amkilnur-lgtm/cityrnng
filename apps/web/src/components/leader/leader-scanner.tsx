"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import jsQR from "jsqr";
import type { LeaderLocation } from "@/lib/api-leader";
import {
  leaderRecentAction,
  leaderScanAction,
  type LeaderRecentScan,
} from "@/app/leader/actions";

const RESULT_LABEL: Record<string, string> = {
  matched: "Засчитано",
  duplicate: "Уже отмечен сегодня",
  no_window: "Сейчас нет пробежки на точке",
  unknown_code: "Код не распознан",
  error: "Ошибка, попробуй ещё раз",
};

const RESULT_OK = new Set(["matched", "duplicate"]);
// A camera decodes the same code many times/sec — ignore repeats of the same
// code within this window so one physical QR = one scan.
const SAME_CODE_COOLDOWN_MS = 4000;
const STORAGE_KEY = "cityrnng_leader_location";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

export function LeaderScanner({ locations }: { locations: LeaderLocation[] }) {
  const [locationId, setLocationId] = useState("");
  const [manual, setManual] = useState("");
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [recent, setRecent] = useState<LeaderRecentScan[]>([]);
  const [pending, startTransition] = useTransition();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  // Keep the selected location readable inside the rAF loop without re-binding.
  const locationRef = useRef("");
  locationRef.current = locationId;

  // Restore last-used location.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && locations.some((l) => l.id === saved)) setLocationId(saved);
    else if (locations.length === 1) setLocationId(locations[0]!.id);
  }, [locations]);

  const refreshRecent = useCallback((loc: string) => {
    if (!loc) return;
    startTransition(async () => {
      setRecent(await leaderRecentAction(loc));
    });
  }, []);

  useEffect(() => {
    if (locationId) {
      localStorage.setItem(STORAGE_KEY, locationId);
      refreshRecent(locationId);
    }
  }, [locationId, refreshRecent]);

  const submitCode = useCallback(
    (code: string) => {
      const loc = locationRef.current;
      if (!loc || !code.trim() || pending) return;
      const now = Date.now();
      if (
        code === lastCodeRef.current.code &&
        now - lastCodeRef.current.at < SAME_CODE_COOLDOWN_MS
      ) {
        return;
      }
      lastCodeRef.current = { code, at: now };
      startTransition(async () => {
        const res = await leaderScanAction(loc, code);
        if (res.ok) {
          setResult({ ok: RESULT_OK.has(res.result), message: RESULT_LABEL[res.result] ?? res.message });
          setRecent(await leaderRecentAction(loc));
        } else {
          setResult({ ok: false, message: res.message });
        }
      });
    },
    [pending],
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCamOn(true);

      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike })
        .BarcodeDetector;
      if (BD) detectorRef.current = new BD({ formats: ["qr_code"] });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (!streamRef.current || !video.videoWidth) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          if (detectorRef.current) {
            const codes = await detectorRef.current.detect(canvas);
            if (codes[0]?.rawValue) submitCode(codes[0].rawValue.trim());
          } else if (ctx) {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(img.data, img.width, img.height);
            if (qr?.data) submitCode(qr.data.trim());
          }
        } catch {
          // transient frame decode error — keep looping
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setCamError(
        (err as Error).name === "NotAllowedError"
          ? "Нет доступа к камере — разреши в настройках браузера или введи код вручную."
          : "Камера недоступна — введи код вручную.",
      );
      setCamOn(false);
    }
  }, [submitCode]);

  // Cleanup on unmount.
  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="type-label">Точка сбора</span>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="h-12 border border-ink bg-paper px-3 font-sans text-[15px] outline-none c3-focus"
        >
          <option value="" disabled>
            — выбери точку —
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} · {l.city}
            </option>
          ))}
        </select>
      </label>

      {result ? (
        <div
          role="status"
          aria-live="polite"
          className={
            "flex items-center gap-3 border p-4 text-[16px] font-semibold " +
            (result.ok
              ? "border-ink bg-ink text-paper"
              : "border-brand-red bg-brand-tint/40 text-brand-red-ink")
          }
        >
          <span aria-hidden className="font-mono text-[20px]">
            {result.ok ? "✓" : "!"}
          </span>
          {result.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border border-ink bg-paper-2 p-4">
        <span className="type-mono-caps">камера</span>
        <div className="relative aspect-square w-full max-w-[360px] self-center overflow-hidden border border-ink bg-ink/90">
          <video
            ref={videoRef}
            playsInline
            muted
            className={"h-full w-full object-cover " + (camOn ? "" : "hidden")}
          />
          {!camOn ? (
            <div className="absolute inset-0 flex items-center justify-center text-center font-mono text-[11px] uppercase tracking-[0.14em] text-paper/70">
              камера выключена
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!camOn ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={!locationId}
              className="inline-flex h-12 items-center justify-center border border-brand-red bg-brand-red px-5 font-sans text-[14px] font-semibold text-paper hover:bg-brand-red-ink disabled:cursor-not-allowed disabled:border-muted-2 disabled:bg-muted-2 disabled:text-graphite"
            >
              Включить камеру
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex h-12 items-center justify-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              Выключить камеру
            </button>
          )}
          {!locationId ? (
            <span className="text-[12px] text-muted">Сначала выбери точку.</span>
          ) : null}
        </div>
        {camError ? (
          <p className="text-[13px] text-brand-red-ink">{camError}</p>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitCode(manual);
          setManual("");
        }}
        className="flex flex-col gap-3 border border-ink bg-paper-2 p-4"
      >
        <span className="type-mono-caps">код вручную</span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="CR-XXXXXXXXXXXX"
            className="h-12 min-w-[200px] flex-1 border border-ink bg-paper px-3 font-mono text-[14px] outline-none c3-focus"
          />
          <button
            type="submit"
            disabled={pending || !locationId || !manual.trim()}
            className="inline-flex h-12 items-center justify-center border border-ink bg-paper px-5 font-sans text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
          >
            {pending ? "…" : "Отметить"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <span className="type-mono-caps">последние отметки</span>
        {recent.length === 0 ? (
          <p className="text-[13px] text-muted">Пока пусто.</p>
        ) : (
          <ul className="flex flex-col border border-ink">
            {recent.map((s, i) => (
              <li
                key={s.id}
                className={
                  "flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] " +
                  (i > 0 ? "border-t border-ink/15" : "")
                }
              >
                <span className="text-ink">
                  {s.runnerName ?? <span className="font-mono text-muted">{s.checkinCode}</span>}
                </span>
                <span
                  className={
                    "font-mono text-[11px] uppercase tracking-[0.12em] " +
                    (RESULT_OK.has(s.result) ? "text-ink" : "text-brand-red")
                  }
                >
                  {RESULT_LABEL[s.result] ?? s.result}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
