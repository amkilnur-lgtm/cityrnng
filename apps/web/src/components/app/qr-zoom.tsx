"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tappable QR that expands to a fullscreen overlay — easier to hold up to a
 * scanner. Closes on ✕, tap anywhere, or Escape. The SVG is server-generated
 * and trusted (qrcode lib output), passed down as a string.
 */
export function QrZoom({
  svg,
  code,
  children,
}: {
  svg: string;
  code: string;
  /** The compact QR block that acts as the open trigger. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while the overlay is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть QR-код на весь экран"
        className="cursor-zoom-in text-left"
      >
        {children}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR-код для отметки"
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center border border-ink bg-paper font-sans text-[22px] leading-none text-ink hover:bg-ink hover:text-paper"
          >
            ✕
          </button>
          <div
            className="w-full max-w-[420px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            // eslint-disable-next-line react/no-danger -- trusted, server-generated SVG
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <code className="font-mono text-[16px] tracking-wider text-ink">
            {code}
          </code>
          <p className="text-[13px] text-muted">
            Поднеси к сканеру · тап в любом месте — закрыть
          </p>
        </div>
      ) : null}
    </>
  );
}
